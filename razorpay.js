// ============================================================
// SupplySarthi — Razorpay Subscription Integration
// ============================================================

/**
 * Initiates Razorpay ₹499 Subscription Payment Flow
 * Single plan: ₹499 / 1 Month
 */
function startSubscriptionCheckout() {
  if (typeof Razorpay === 'undefined') {
    toast('❌ Razorpay SDK not loaded. Please check your internet connection.', true);
    return;
  }

  beginBusy('Preparing Order...', 'Connecting to Razorpay');

  api('createRazorpayOrder', {}, function (res) {
    endBusy();
    if (!res || !res.success) {
      toast('❌ Failed to initiate payment: ' + (res ? res.message : 'Unknown error'), true);
      return;
    }

    var prefillData = res.prefill || {};

    var options = {
      key: res.keyId || CONFIG.RAZORPAY_KEY_ID,
      amount: res.amount,
      currency: res.currency || 'INR',
      name: CONFIG.APP_NAME || 'SupplySarthi',
      description: 'SupplySarthi Monthly Subscription (₹499)',
      image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      order_id: res.orderId,
      handler: function (response) {
        verifySubscriptionPayment(response);
      },
      prefill: {
        name: prefillData.name || '',
        contact: prefillData.contact || '',
        email: prefillData.email || ''
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
 * Also captures and sends customer company, mobile, email for logging
 */
function verifySubscriptionPayment(rzpResponse) {
  beginBusy('Verifying Payment...', 'Updating your subscription status');

  // Fetch Razorpay payment details to get customer info (company, mobile, email)
  var paymentId = rzpResponse.razorpay_payment_id || '';

  var payload = {
    razorpay_order_id: rzpResponse.razorpay_order_id,
    razorpay_payment_id: paymentId,
    razorpay_signature: rzpResponse.razorpay_signature,
    planType: 'monthly',
    customerCompany: '', // Will be filled from Razorpay prefill data
    customerMobile: '',
    customerEmail: ''
  };

  // Try to extract customer info from the Razorpay checkout instance
  // The prefill data is the most reliable source
  try {
    var prefillName = document.querySelector('[name="card[name]"]');
    var prefillEmail = document.querySelector('[name="email"]');
    var prefillContact = document.querySelector('[name="contact"]');
    if (prefillName) payload.customerCompany = prefillName.value || '';
    if (prefillEmail) payload.customerEmail = prefillEmail.value || '';
    if (prefillContact) payload.customerMobile = prefillContact.value || '';
  } catch (e) {
    // Ignore DOM extraction errors
  }

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
