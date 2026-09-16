import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { AppProvider } from './context/AppContext'
import Account from './pages/Account'
import Checkout from './pages/Checkout'
import Discounts from './pages/Discounts'
import Home from './pages/Home'
import Orders from './pages/Orders'
import Receipt from './pages/Receipt'
import Placeholder from './pages/Placeholder'
import ProductDetail from './pages/ProductDetail'
import SearchPage from './pages/Search'
import StorePage from './pages/StorePage'
import Stores from './pages/Stores'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/store/:id" element={<StorePage />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/discounts" element={<Discounts />} />
          <Route path="/account" element={<Account />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order/:id" element={<Receipt />} />

          {/* Footer destinations, stubbed until the copy exists. */}
          <Route path="/about" element={<Placeholder title="About us" />} />
          <Route path="/corporate" element={<Placeholder title="Corporate" />} />
          <Route path="/faqs" element={<Placeholder title="FAQs" />} />
          <Route path="/contact" element={<Placeholder title="Contact us" />} />
          <Route path="/services/consultation" element={<Placeholder title="Consultation" />} />
          <Route
            path="/services/prescription"
            element={<Placeholder title="Medical prescription by doctor" />}
          />
          <Route path="/policy/privacy" element={<Placeholder title="Privacy" />} />
          <Route path="/policy/terms" element={<Placeholder title="Terms and conditions" />} />
          <Route path="/policy/returns" element={<Placeholder title="Return and refund" />} />
          <Route
            path="/policy/delivery"
            element={<Placeholder title="Medicine delivery and cancellation" />}
          />

          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
