export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost',
  authServiceUrl: '/api/auth',
  productServiceUrl: '/api/products',
  cartServiceUrl: '/api/cart',
  categoryServiceUrl: '/api/categories',

  // ✅ Unified API Gateway URL
  orderServiceUrl: '/api/orders',
  // adminServiceUrl deprecated - logic decentralized
  apiUrl: '/api', // Correct relative path for proxy
  stripePublicKey:
    'pk_test_51ShTuGP8LLjoD12kBtPrDMAkVE4Xyc5DvaxBA33sVgMewPbPb3rEtkMwr5MtErN80OfZXzNuJZKqgVcKkJkVLb9P00CWxfVhvV',
};
