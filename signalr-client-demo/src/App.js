import React, { useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import "./App.css";

function App() {
  const [connection, setConnection] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState("");
  const [tempUser, setTempUser] = useState(""); // Input tạm để nhập tên
  const [message, setMessage] = useState("");
  const [groupName, setGroupName] = useState("");
  const [isJoinedPublic, setIsJoinedPublic] = useState(false);
  const [isJoinedPrivate, setIsJoinedPrivate] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Chưa kết nối");

  // Khởi tạo kết nối SignalR
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7048/chatHub", { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  // Xử lý kết nối và lắng nghe sự kiện
  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log("Kết nối SignalR thành công");
          setConnectionStatus("Đã kết nối");
        })
        .catch((e) => {
          console.error("Kết nối thất bại: ", e);
          setConnectionStatus(`Lỗi kết nối: ${e.message}`);
        });

      // On: Lắng nghe tin nhắn group
      connection.on("ReceiveGroupMessage", (user, message) => {
        setGroupMessages((prev) => [...prev, `${user}: ${message}`]);
      });

      // On: Lắng nghe thông báo khi join group
      connection.on("ReceiveGroupNotification", (message) => {
        setNotifications((prev) => [...prev, `System: ${message}`]);
      });

      // On: Lắng nghe thông báo hệ thống
      connection.on("ReceiveSystemNotification", (notification) => {
        setNotifications((prev) => [...prev, notification]);
      });
    }
  }, [connection]);

  // Xử lý nhập tên user
  const handleSetUser = () => {
    if (tempUser) {
      // Chuẩn hóa tên: ví dụ user1 → User1
      const normalizedUser =
        tempUser.charAt(0).toUpperCase() + tempUser.slice(1).toLowerCase();
      setUser(normalizedUser);
    }
  };

  // Emit: Tham gia group
  const joinGroup = (group) => {
    if (
      connection &&
      connection.state === signalR.HubConnectionState.Connected
    ) {
      connection
        .invoke("JoinGroup", group)
        .then(() => {
          console.log(`Đã tham gia group ${group}`);
          if (group === "PublicGroup") setIsJoinedPublic(true);
          if (group === "PrivateGroup") setIsJoinedPrivate(true);
        })
        .catch((e) => {
          console.error("Tham gia group thất bại: ", e);
          setNotifications((prev) => [
            ...prev,
            `System: Tham gia group ${group} thất bại: ${e.message}`,
          ]);
        });
    } else {
      setNotifications((prev) => [...prev, "System: Chưa kết nối đến server"]);
    }
  };

  // Emit: Gửi tin nhắn đến group
  const sendMessageToGroup = () => {
    if (
      connection &&
      connection.state === signalR.HubConnectionState.Connected &&
      groupName &&
      message
    ) {
      connection
        .invoke("SendMessageToGroup", groupName, user, message)
        .then(() => console.log(`Đã gửi tin nhắn đến ${groupName}`))
        .catch((e) => {
          console.error("Gửi thất bại: ", e);
          setNotifications((prev) => [
            ...prev,
            `System: Gửi tin nhắn thất bại: ${e.message}`,
          ]);
        });
      setMessage("");
    } else {
      setNotifications((prev) => [
        ...prev,
        "System: Vui lòng chọn group và nhập tin nhắn",
      ]);
    }
  };

  return (
    <div className="container">
      <h1>SignalR Demo</h1>
      <p>Connection Status: {connectionStatus}</p>
      <p>
        User: {user || "Chưa nhập tên"} (Connection ID:{" "}
        {connection?.connectionId || "Chưa kết nối"})
      </p>

      {/* Nhập Tên User */}
      {!user && (
        <div className="section user-input">
          <h2>Nhập Tên User</h2>
          <input
            value={tempUser}
            onChange={(e) => setTempUser(e.target.value)}
            placeholder="Nhập User1, User2, hoặc User3"
          />
          <button onClick={handleSetUser}>Xác Nhận Tên</button>
        </div>
      )}

      {user && (
        <>
          {/* Join Groups */}
          <div className="section">
            <h2>Tham Gia Group</h2>
            {!isJoinedPublic && (
              <button
                onClick={() => joinGroup("PublicGroup")}
                disabled={
                  !connection ||
                  connection.state !== signalR.HubConnectionState.Connected
                }
              >
                Tham gia Group Chung (PublicGroup)
              </button>
            )}
            {(user === "User1" || user === "User2") && !isJoinedPrivate && (
              <button
                onClick={() => joinGroup("PrivateGroup")}
                disabled={
                  !connection ||
                  connection.state !== signalR.HubConnectionState.Connected
                }
              >
                Tham gia Group Private (PrivateGroup - Chỉ User1 & User2)
              </button>
            )}
          </div>

          {/* Gửi Tin Nhắn Đến Group */}
          <div className="section">
            <h2>Gửi Tin Nhắn Đến Group</h2>
            <select
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            >
              <option value="">Chọn group</option>
              {isJoinedPublic && (
                <option value="PublicGroup">PublicGroup (Chung)</option>
              )}
              {isJoinedPrivate && (
                <option value="PrivateGroup">PrivateGroup (Private)</option>
              )}
            </select>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tin nhắn"
            />
            <button
              onClick={sendMessageToGroup}
              disabled={
                !connection ||
                connection.state !== signalR.HubConnectionState.Connected
              }
            >
              Gửi
            </button>
          </div>

          {/* Tin Nhắn Group */}
          <div className="section">
            <h2>Tin Nhắn Group</h2>
            <ul>
              {groupMessages.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>

          {/* Thông Báo */}
          <div className="section">
            <h2>Thông Báo</h2>
            <ul>
              {notifications.map((notif, idx) => (
                <li key={idx}>{notif}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
