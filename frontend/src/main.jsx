import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { Toaster } from "react-hot-toast";

import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

ReactDOM.createRoot(
  document.getElementById('root')
).render(

  <>
    <Toaster
      position="top-right"
    />

    <App />
  </>

)