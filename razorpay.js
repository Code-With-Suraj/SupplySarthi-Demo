// ============================================================
// SupplySarthi — Razorpay Subscription Integration
// ============================================================

/**
 * Initiates Razorpay Subscription Payment Flow
 * @param {string} planType - 'monthly' or 'yearly'
 * @param {boolean} isPromo - True if first month promo (₹499) applies
 */
function startSubscriptionCheckout(planType, isPromo) {
  if (typeof Razorpay === 'undefined') {
    toast('❌ Razorpay SDK not loaded. Please check your internet connection.', true);
    return;
  }

  beginBusy('Preparing Order...', 'Connecting to Razorpay');

  api('createRazorpayOrder', { planType: planType || 'monthly', isPromo: !!isPromo }, function (res) {
    endBusy();
    if (!res || !res.success) {
      toast('❌ Failed to initiate payment: ' + (res ? res.message : 'Unknown error'), true);
      return;
    }

    var options = {
      key: res.keyId || CONFIG.RAZORPAY_KEY_ID,
      amount: res.amount,
      currency: res.currency || 'INR',
      name: CONFIG.APP_NAME || 'SupplySarthi',
      description: (res.planType === 'yearly' ? 'Yearly Subscription Plan' : 'Monthly Subscription Plan'),
      image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      order_id: res.orderId,
      handler: function (response) {
        verifySubscriptionPayment(response, res.planType);
      },
      prefill: {
        name: localStorage.getItem('userBusinessName') || '',
        contact: localStorage.getItem('userPhone') || ''
      },
      theme: {
        color: '#166534'
      },
      modal: {
        ondismiss: function () {
          toast('ℹ️ Payment process cancelled', false);
        }
      }
    };

    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
      toast('❌ Payment Failed: ' + (response.error ? response.error.description : 'Transaction denied'), true);
    });
    rzp.open();
  }, function (err) {
    endBusy();
    toast('❌ Connection error: ' + err.message, true);
  });
}

/**
 * Verifies Razorpay Payment Signature with GAS Backend
 */
function verifySubscriptionPayment(rzpResponse, planType) {
  beginBusy('Verifying Payment...', 'Updating your subscription status');

  var payload = {
    razorpay_order_id: rzpResponse.razorpay_order_id,
    razorpay_payment_id: rzpResponse.razorpay_payment_id,
    razorpay_signature: rzpResponse.razorpay_signature,
    planType: planType
  };

  api('verifyRazorpayPayment', payload, function (res) {
    endBusy();
    if (res && res.success) {
      toast('🎉 ' + (res.message || 'Subscription activated successfully!'), false);
      if (typeof closeModal === 'function') {
        closeModal('subscriptionModal');
      }
      setTimeout(function () {
        if (window.location.pathname.includes('subscription.html')) {
          window.location.href = 'index.html';
        } else {
          window.location.reload();
        }
      }, 1500);
    } else {
      toast('❌ Payment verification failed: ' + (res ? res.message : 'Please contact support'), true);
    }
  }, function (err) {
    endBusy();
    toast('❌ Verification request error: ' + err.message, true);
  });
}
