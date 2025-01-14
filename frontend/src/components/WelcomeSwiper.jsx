import React from 'react'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { A11y, Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import darkModeBanner from '../assets/imgs/welcome-darkmode.png'
import zBusinessBanner from '../assets/imgs/z-business-welcome.png'
const WelcomeSwiper = () => {
  return (
    <Swiper
      className="mt-12 flex w-full items-center justify-center"
      modules={[Navigation, Pagination, A11y, Autoplay]}
      autoplay={{
        delay: 5000,
        disableOnInteraction: false,
      }}
      loop={true}
      slidesPerView={1}
      onSlideChange={() => console.log('slide change')}
      onSwiper={(swiper) => console.log(swiper)}
      navigation
      pagination={{ clickable: true }}
      scrollbar={{ draggable: true }}
    >
      <SwiperSlide
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          paddingBottom: 100,
        }}
      >
        <img className="w-[380px] object-contain" src={darkModeBanner} alt="" />
        <h3 className="mt-3 text-blue-800">Giao diện Dark Mode</h3>

        <span className="mt-2 text-sm">
          Thư giãn và bảo vệ mắt với chế độ <b>giao diện tối</b> mới trên Zalo
          PC
        </span>

        <button className="mt-3 inline-block rounded bg-blue-300 bg-opacity-50 px-4 py-2 text-sm font-bold text-[#0045ad] hover:bg-opacity-60">
          Thử ngay
        </button>
      </SwiperSlide>
      <SwiperSlide
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          paddingBottom: 100,
        }}
      >
        <img
          className="w-[380px] object-contain"
          src={zBusinessBanner}
          alt=""
        />
        <h3 className="mt-3 text-blue-800">
          Kinh doanh hiệu quả với zBusiness Pro
        </h3>

        <span className="mt-3 text-sm">
          Bán hàng chuyên nghiệp với <b>Nhãn Business</b> và{' '}
          <b>Bộ công cụ kinh doanh,</b> mở khóa tiềm năng{' '}
          <b>tiếp cận khách hàng</b> trên Zalo
        </span>

        <button className="mt-3 inline-block rounded bg-blue-300 bg-opacity-50 px-4 py-2 text-sm font-bold text-[#0045ad] hover:bg-opacity-60">
          Thử ngay
        </button>
      </SwiperSlide>
    </Swiper>
  )
}

export default WelcomeSwiper
