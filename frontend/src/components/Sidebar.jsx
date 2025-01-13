import React, { useState } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import addFriendIcon from "../assets/icons/add-friend-btn.png";
import chevronDown from "../assets/icons/chevron-down.png";
import createGroupIcon from "../assets/icons/create-group-btn.png";
import moreIcon from "../assets/icons/more-btn.png";
import SidebarControls from "./SidebarControls";

const Sidebar = () => {
  const [isSearching, setIsSearching] = useState(false);

  return (
    <aside className="max-w-[410px] h-screen flex">
      <SidebarControls />
      <div className="right w-[410px] h-screen border-r border-gray-300 overflow-hidden">
        {/* Search form */}
        <div className="top-search px-4 flex justify-between items-center mt-4 mb-5">
          <form className="form relative ">
            <button className="absolute left-2 -translate-y-1/2 top-1/2 p-1">
              <svg
                width="17"
                height="16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-labelledby="search"
                className="w-5 h-5 text-gray-700"
              >
                <path
                  d="M7.667 12.667A5.333 5.333 0 107.667 2a5.333 5.333 0 000 10.667zM14.334 14l-2.9-2.9"
                  stroke="currentColor"
                  strokeWidth="1.333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </button>
            <input
              className="bg-[#ebecf0] text-sm input rounded-md pl-8 pr-1 py-[5px] border border-transparent focus:outline-none focus:border-blue-500 placeholder-gray-500 transition-all duration-300"
              placeholder="Tìm kiếm"
              required=""
              type="text"
            />
          </form>

          <div className="h-[30px] flex items-center justify-center">
            <button className="hover:bg-gray-200 h-full p-2 flex items-center justify-center  transition-all rounded-md">
              <img src={addFriendIcon} alt="" />
            </button>
            <button className="hover:bg-gray-200 h-full p-2 flex items-center justify-center  transition-all rounded-md">
              <img src={createGroupIcon} alt="" />
            </button>
          </div>
        </div>

        <div className="">
          <div className="px-4 flex justify-between items-center w-full">
            <div className="hidden sm:block">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-3" aria-label="Tabs">
                  <a
                    href="#"
                    className="shrink-0 border-b-2 border-primary-blue pb-1 text-sm font-semibold text-primary-blue  hover:text-primary-blue"
                  >
                    Ưu tiên
                  </a>

                  <a
                    href="#"
                    className="shrink-0 border-b-2 border-transparent pb-1 text-sm font-semibold text-gray-500  hover:text-primary-blue"
                  >
                    Khác
                  </a>
                </nav>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-2.5 text-xs hover:bg-gray-200 rounded-full px-2 py-1 transition-all">
                Phân loại
                <img src={chevronDown} alt="" />
              </button>

              <button className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary-blue w-6 h-6 p-1 hover:bg-gray-200 rounded-full transition-all">
                <img src={moreIcon} alt="" />
              </button>
            </div>
          </div>
        </div>
        <Scrollbars
          autoHeight
          autoHeightMax="calc(100vh - 64px)"
          thumbSize={200}
        >
          <ul className="chat-list border-t border-gray-200 max-w-full max-h-screen">
            {[
              1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
              20,
            ].map((item, index) => (
              <li
                key={index}
                className="flex items-stretch gap-4 h-[74px] hover:bg-gray-100 px-3.5 py-3.5 cursor-pointer select-none"
              >
                <img
                  src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2680&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt=""
                  className="aspect-square w-12 h-12 rounded-full object-cover"
                />

                <div className="overflow-hidden">
                  <div className="flex gap-1 items-center justify-between">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-1 text-ellipsis overflow-hidden w-[180px]">
                      Test Group
                    </h3>
                    <div className="flex items-center flex-row">
                      <span className="text-xs">2 ngày</span>
                    </div>
                  </div>

                  <p className="mt-0.5 text-gray-600 text-sm line-clamp-1">
                    Nguyễn Trọng Tiến đổi tên nhóm thanh
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Scrollbars>
      </div>
    </aside>
  );
};

export default Sidebar;
