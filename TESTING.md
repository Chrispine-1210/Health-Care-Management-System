# Testing Guide

## API Testing

### Demo Accounts (Any Password)

- `admin@thandizo.com` → Admin role
- `pharmacist@thandizo.com` → Pharmacist role
- `staff@thandizo.com` → Staff role
- `customer@thandizo.com` → Customer role
- `driver@thandizo.com` → Driver role

### Manual Testing

Use the `/debug` endpoint for manual API testing:

```bash
# 1. Navigate to http://localhost:5000/debug
# 2. Click buttons to test endpoints
# 3. View responses in JSON panels
```

### cURL Examples

```bash
# Health check
curl http://localhost:5000/health | jq

# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@thandizo.com","password":"test"}' | jq

# Get products (with JWT token)
TOKEN="<jwt_from_login>"
curl http://localhost:5000/api/products \
  -H "Authorization: Bearer $TOKEN" | jq

# Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"items":[{"productId":"prod-1","quantity":1}],"latitude":-13.9626,"longitude":33.7741}' | jq
```

## Testing Checklist

### Auth
- [ ] Login works with demo accounts
- [ ] JWT token stored in localStorage
- [ ] Bearer token sent in Authorization header
- [ ] 401 errors when token missing/invalid
- [ ] Logout clears token

### Products
- [ ] Products endpoint returns data
- [ ] Products filtered by category
- [ ] Prescription requirement respected

### Orders
- [ ] Orders created successfully
- [ ] Delivery cost calculated correctly
- [ ] Order status updates work
- [ ] Order history displayed

### Roles
- [ ] Admin sees admin dashboard
- [ ] Pharmacist sees prescription queue
- [ ] Staff sees POS interface
- [ ] Customer sees shop
- [ ] Driver sees delivery routes

### UI
- [ ] Dark/light theme works
- [ ] Responsive on mobile
- [ ] Forms validate correctly
- [ ] Error messages display

## Performance Testing

```bash
# Load test (requires Apache Bench)
ab -n 1000 -c 10 http://localhost:5000/api/products

# Check response times
curl -w "@curl-format.txt" http://localhost:5000/health
```

## Logs

Check the dev console for logs:
- Timestamps and levels
- API request/response details
- Error stack traces
- Database operations
