function getCartPrice(cart) {
  const subtotal = cart.subTotal
  const subtotalNet = parseFloat(
    cart.items
      .reduce((acc, item) => {
        return acc + item.price_net
      }, 0)
      .toFixed(2)
  )

  const shipping = cart.shipping
  const totalNet = subtotalNet + (shipping / 1.19) * 0.19
  const total = subtotal + shipping
  const vat = total - totalNet

  return {
    subtotal,
    subtotalNet,
    shipping,
    totalNet,
    vat,
    total,
  }
}

module.exports = { getCartPrice }
