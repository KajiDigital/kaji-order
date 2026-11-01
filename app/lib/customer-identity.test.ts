import assert from 'node:assert/strict'
import {
  isAllowedCustomer,
  normalizeEmail,
  normalizeUkPhone,
  sameCustomer,
} from './customer-identity'

assert.equal(normalizeEmail('  Jane@Shop.COM '), 'jane@shop.com')
assert.equal(normalizeEmail(''), null)

assert.equal(normalizeUkPhone('07700 900123'), '447700900123')
assert.equal(normalizeUkPhone('+44 7700 900123'), '447700900123')
assert.equal(normalizeUkPhone('00447700900123'), '447700900123')
assert.equal(normalizeUkPhone('7700900123'), '447700900123')

assert.equal(
  sameCustomer({ phone: '07700 900123', email: 'a@x.com' }, { phone: '+447700900123', email: 'b@x.com' }),
  true,
  'same phone with a new email is still the same customer'
)
assert.equal(
  sameCustomer({ phone: '07700 900111', email: 'a@x.com' }, { phone: '07700 900222', email: 'a@x.com' }),
  true,
  'same email still matches when phones differ'
)
assert.equal(
  sameCustomer({ phone: '07700 900111', email: 'a@x.com' }, { phone: '07700 900222', email: 'b@x.com' }),
  false,
  'different phone and email are different customers'
)

assert.equal(
  isAllowedCustomer({ phone: '07700 900123' }, [{ phone: '+44 7700 900123', email: 'vip@shop.com' }]),
  true
)
assert.equal(
  isAllowedCustomer({ email: 'vip@shop.com' }, [{ phone: '07700 900123', email: 'vip@shop.com' }]),
  true
)
assert.equal(
  isAllowedCustomer({ phone: '07700 900999' }, [{ phone: '07700 900123' }]),
  false
)

console.log('customer-identity tests passed')
