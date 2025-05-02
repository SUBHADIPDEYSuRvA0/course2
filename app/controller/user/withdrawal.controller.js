const axios = require('axios');
const User = require('../../models/user');
const Withdrawal = require('../../models/withdrawl');

class WithdrawalController {
  async requestWithdrawal(req, res) {
    try {
      const { amount, upi } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.mybonus < amount) {
        return res.status(400).json({ message: 'Not enough bonus balance' });
      }

      // Razorpay Auth
      const razorpayAuth = {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET
      };

      // STEP 1: Create Contact
      const contactRes = await axios.post('https://api.razorpay.com/v1/contacts', {
        name: user.name,
        email: user.email,
        contact: user.phone,
        type: 'customer',
        reference_id: user._id.toString(),
        notes: {
          userId: user._id.toString()
        }
      }, { auth: razorpayAuth });

      const contactId = contactRes.data.id;

      // STEP 2: Create Fund Account
      const fundAccountRes = await axios.post('https://api.razorpay.com/v1/fund_accounts', {
        contact_id: contactId,
        account_type: 'vpa',
        vpa: {
          address: upi
        }
      }, { auth: razorpayAuth });

      const fundAccountId = fundAccountRes.data.id;

      // STEP 3: Create Payout
      const payoutRes = await axios.post('https://api.razorpay.com/v1/payouts', {
        account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, // <-- Put your Razorpay Virtual Account Number in .env
        fund_account_id: fundAccountId,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        mode: 'UPI',
        purpose: 'payout',
        queue_if_low_balance: true,
        reference_id: `withdraw_${user._id}_${Date.now()}`,
        narration: 'User Withdrawal'
      }, { auth: razorpayAuth });

      // Save withdrawal in DB
      await Withdrawal.create({
        userId: user._id,
        amount,
        status: payoutRes.data.status, // 'processing', 'queued', 'completed'
        transactionId: payoutRes.data.id, // Saving payout ID into transactionId
        notes: `Withdrawal initiated via Razorpay`
      });

      // Deduct user's bonus
      user.mybonus -= amount;
      await user.save();

      res.json({ 
        message: 'Withdrawal request successful', 
        payoutId: payoutRes.data.id,
        payoutStatus: payoutRes.data.status 
      });

    } catch (err) {
      console.error('Withdrawal Error:', err.response?.data || err.message);
      res.status(500).json({ 
        error: 'Withdrawal failed', 
        details: err.response?.data || err.message 
      });
    }
  }
}

module.exports = new WithdrawalController();
