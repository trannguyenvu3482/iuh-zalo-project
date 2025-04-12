const dummyFriends = [
  { id: 1, fullname: 'Nguyễn Trọng Tính', avatar: 'https://i.pravatar.cc/40?img=1' },
  { id: 2, fullname: 'Antoine Paumy', avatar: 'https://i.pravatar.cc/40?img=2' },
  { id: 3, fullname: 'Bảo Trân', avatar: 'https://i.pravatar.cc/40?img=3' },
  { id: 4, fullname: 'Bùi Anh Thy', avatar: 'https://i.pravatar.cc/40?img=4' },
  { id: 5, fullname: 'Bùi Hải Đăng', avatar: 'https://i.pravatar.cc/40?img=5' },
  { id: 6, fullname: 'Cellphones Kha Vạn Cân Linh Đông', avatar: 'https://i.pravatar.cc/40?img=6', isBusiness: true },
  { id: 7, fullname: 'Chau Tiểu Long', avatar: 'https://i.pravatar.cc/40?img=7' },
]

const Contacts = () => {
  const friends = dummyFriends
  const groupedFriends = friends.reduce((acc, friend) => {
    const letter = friend.fullname[0].toUpperCase()
    acc[letter] = acc[letter] || []
    acc[letter].push(friend)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="font-semibold text-lg mb-1">Danh sách bạn bè</h1>
        <p className="text-sm text-gray-500">Bạn bè ({friends.length})</p>
      </div>

      <div className="p-4 flex items-center gap-2">
        <input
          placeholder="Tìm bạn"
          className="w-full rounded-md border border-gray-200 bg-[#ebecf0] py-1.5 px-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <button className="border px-2 py-1 rounded text-sm hover:bg-gray-100">
          Tên (A-Z)
        </button>
        <button className="border px-2 py-1 rounded text-sm hover:bg-gray-100">
          Tất cả
        </button>
      </div>

      <div className="overflow-y-auto p-4">
        {Object.keys(groupedFriends)
          .sort()
          .map((letter) => (
            <div key={letter} className="mb-4">
              <p className="text-sm font-semibold text-gray-500 mb-2">{letter}</p>
              {groupedFriends[letter].map((friend) => (
                <div key={friend.id} className="flex items-center gap-2 py-1">
                  <img
                    src={friend.avatar}
                    alt={friend.fullname}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="text-sm">{friend.fullname}</span>
                  {friend.isBusiness && (
                    <span className="ml-auto text-xs bg-blue-100 text-blue-500 px-1.5 py-0.5 rounded">
                      Business
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}

export default Contacts
