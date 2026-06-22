import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Product from '../models/Product.js'
import connectDB from './database.js'

dotenv.config()

const products = [
  {
    name: 'Ethereal Glow Serum',
    category: 'Serums',
    price: 84.00,
    desc: 'Radiance Boosting Complex',
    details: 'An ethereal blend of real rose quartz micro-crystals and fermented hibiscus extract. This serum penetrates deeply to restore luminous clarity and youthful elasticity to your complexion.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiKlb1L9_tBK9uKv1ctnfXAKtaBR33HH29un-93a8xE8NNwa6XXBKK8lUSYyRDx-CeNhEOW5d8UB6JT6HEQYgr6byfKQndRmFrEw__fzzeppcLcKB0jEY0TxezQoUmIenLA8fh65gnwg9ZrLl0iTh6jo5khcb3snIRtBv-sbmdY3WkmFZXwVM9arlKGdb1u0dZqqV6y25vHrz8uDzVUT9i0_zYUH9Wd9AbU8q4exxL-YjxQEREi19YevEtHPDJ-eskv2AWS_bHr6gw',
    tag: 'NEW IN',
    stock: 50,
    rating: 4.8,
    reviews: 128
  },
  {
    name: 'Velvet Hydration Balm',
    category: 'Moisturizers',
    price: 62.00,
    desc: '24h Deep Moisture',
    details: 'A rich, velvety balm that provides 24-hour deep moisture. Formulated with shea butter and hyaluronic acid to lock in hydration and restore skin barrier.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATJwSvnE5qAuSGIBQrqXxUKBAMRUXwR5BJ5OPpuh_krgcphKb9UvXP1vbepfH4h7U3h-4mKxuWUx-zWZfWPbaYXn7q_3fnW6aYs3HMRD24raRVwS0DlQsMYWPqCQG0wiklq_Ew7PPqzrQqkmMGkYKZoCNTpbJqvlju3z0d4AWR_i3kUxLgEDcAxEVxLUTYCLOyMBtZ6mYuFNv8L4EBAnVEfap8xK3Upv8RhnNxmllhZA4pViXYt4V7gkkH5YGJCx7OqqAWlyeD8DXa',
    tag: null,
    stock: 35,
    rating: 4.6,
    reviews: 95
  },
  {
    name: 'Celestial Gold Oil',
    category: 'Serums',
    price: 115.00,
    desc: 'Nourishing Botanical Blend',
    details: 'A luxurious botanical blend of cold-pressed oils including jojoba, rosehip, and argan. Packed with antioxidants and essential fatty acids for deep nourishment.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSQx-EUdhkt3kGR7pI3FBIG1R_vUv3nahCthDuOWDbarf61mXCvc8LEkkkTh_rKJNqG_iPMMOdQgNYjg_A5ms2dgNQh8iwc7m3xZiBFUptSL7qsI0VirO5FX-FFTGFlnkerCbXo3-rGDettzJ-W4Aw2MTBuJ_tzjWxs7MCmq11g9mKo1qKF2ddAIhVJC4iZovmMfHQVzf0_JuzXEzNqVOc386E2xSktvUdilWKxcm7WDNYCc9Cm4_9bPyEAuot1H3J_wF7AlLMqzy2',
    tag: 'VEGAN',
    stock: 20,
    rating: 4.9,
    reviews: 67
  },
  {
    name: 'Pure Zen Cleanser',
    category: 'Cleansers',
    price: 48.00,
    desc: 'Detoxifying Clay Therapy',
    details: 'A gentle yet effective clay cleanser that detoxifies while maintaining skin\'s natural moisture barrier. Infused with kaolin clay and green tea extract.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp9JvACqxaZRof6kACqEehQxVDf5b8d4mfGIvhDrtroVNy655Gg9K4b9rx9EdxteDqIIvzdjsUMw0ev6y1f2B7olqzZO7vpxVKttiIgzseY-H-SmW8DvftqdmUidNffbVulRztbeehnojB82MNyAk2UuPOP0RCbOBGSC_9ULaTnHtTHvmVzJMxFDOFpuJyvbAWeMC91bQKFR5x-Sq06_YwYfjuPBfyaJ-j4lXVyO2rd3YdNbFFxtxQKs4uSBXxc9W7Rvz7CChSeYdQ',
    tag: null,
    stock: 60,
    rating: 4.5,
    reviews: 210
  },
  {
    name: 'Midnight Recovery Mask',
    category: 'Masks',
    price: 78.00,
    desc: 'Intense Repair Treatment',
    details: 'An overnight mask that works while you sleep. Infused with peptides and ceramides for intense repair and rejuvenation. Wake up to plump, radiant skin.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNC0uEOys551y45YB5Mm1yHyuSw-QU5MATFxP9s3h1gT3pOi6jTF6gmtwEOfLB4swiveoBVLJwqjnuETdOit9ZubL4TL2vu402Gj8BojLCkVGnLrrn2jCcXnEhDC0DKc0kLaeFftTNzBgSQUKb-BbJ8N5Mq5S2yoUrprQjb3sD2eOFa5vKARwuLsuUcKzZpGLpihiUnSyHzKAmGAnzL-W4rg483ORIHs2IQ8uMoAkwBHwO0sIiglZgpg0v3T2BhTvTOw2nECacSifz',
    tag: 'BEST SELLER',
    stock: 25,
    rating: 4.7,
    reviews: 156
  },
  {
    name: 'Aura Mist Toner',
    category: 'Toners',
    price: 42.00,
    desc: 'Rosewater & Silver Ions',
    details: 'A refreshing mist toner with rosewater and silver ions. Calms and balances the skin while providing a boost of hydration and a subtle glow.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGC6plBTcjE6trEJ6yQ9gGmIyQsX5buSSMDfxTHW8OpR6_q92_JkgqP3GKqayJq07b9CLisk8doV0b2bOCe11kbWnrzWc_mZ79gybnEeYKehPHWMqtCL_LVmu_384g-P-zvCPYIi8acQqxy0W8UkzubLLORZyBjg2bDW6VMRT1pQUx6We5EcM7ef4oGtxHCvdXatKsbF3RgPrsPn3q_Z8aL5W-CRdCJ3zhKcYMgDuo2J9DFaWbE4Iyr662GHZDdn0-mlIZFe-OtR75',
    tag: null,
    stock: 45,
    rating: 4.4,
    reviews: 88
  },
  {
    name: 'Brighten Eye Elixir',
    category: 'Eye Care',
    price: 55.00,
    desc: 'Vitamin C + Caffeine',
    details: 'A powerful eye elixir with vitamin C and caffeine. Reduces puffiness and brightens dark circles while smoothing fine lines around the delicate eye area.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8Ve7qM66kFaBpRDe6Y3oGsbVQOUgOwaGnY_pJMgJdbq-IsLuh9AxX6xaoqwQaUFRcm6y7Lw8hGOE15_oiUkqUY_hDtFJLaZ4Ew4BNlfkPPNFhP3VJlAIP4hnVbjMJQoKpTYA6jdnl4zpsUl92qeIbGFbfyCILiKPDyEbW6GBPA2yrREkbWa3grGGIBC8tN3QAhuRueoUxlPHY22hnPv64g89OLb3-nU4Crc6aZvoGXYz1YPuUa5J1vvDD0s2NSntwZb1um6u_H3hM',
    tag: null,
    stock: 30,
    rating: 4.3,
    reviews: 73
  },
  {
    name: 'Silk Shield SPF 50',
    category: 'Sun Care',
    price: 52.00,
    desc: 'Invisible Daily Defense',
    details: 'A lightweight, invisible SPF 50 sunscreen that provides broad-spectrum protection without white cast. Formulated with zinc oxide and niacinamide.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArVXlB9qsckj2wuhExyZgzw-POif1tJCZtpt93MQbXVzhm6oCDA5XMtEvcZUv2cE0kSoGeC9iyYMPiY7VGTEHXOgPWHb0VoS3mIAxEBCBC8P2vlVS_oNESg319gV-Jvfs3SaRJHS-fjS0UIZ41v4Xo1LvAp9LOz0lrMgY1ID6ZXVTylATQFqn3fsyo8Eu9_6Y56kJ4NKlMngUd0igq_TRaj0-X2Z8Gig_0lY3VIfugaFjWlOkf1VC4ciNohVb6xb790fIZuvgRZfq5',
    tag: null,
    stock: 40,
    rating: 4.6,
    reviews: 112
  }
]

const seedDatabase = async () => {
  try {
    await connectDB()
    
    // Clear existing products
    await Product.deleteMany({})
    console.log('🗑️  Products cleared')
    
    // Insert new products
    const inserted = await Product.insertMany(products)
    console.log(`✅ ${inserted.length} products seeded successfully`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error.message)
    process.exit(1)
  }
}

seedDatabase()