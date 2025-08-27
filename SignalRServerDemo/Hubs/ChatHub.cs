using Microsoft.AspNetCore.SignalR;

namespace SignalRServerDemo.Hubs
{
    public class ChatHub : Hub
    {
        // On: Lắng nghe client gửi tin nhắn đến group
        public async Task SendMessageToGroup(string groupName, string user, string message)
        {
            await Clients.Group(groupName).SendAsync("ReceiveGroupMessage", user, message);
            await Clients.Caller.SendAsync("ReceiveSystemNotification", $"[System] Bạn đã gửi tin nhắn đến group {groupName}.");
        }

        // On: Lắng nghe client yêu cầu tham gia group
        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.Group(groupName).SendAsync("ReceiveGroupNotification", $"[System] User {Context.ConnectionId} đã tham gia group {groupName}.");
            await Clients.Caller.SendAsync("ReceiveSystemNotification", $"[System] Bạn đã tham gia group {groupName}.");
        }

        // On: Lắng nghe client yêu cầu rời group
        public async Task LeaveGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            await Clients.Group(groupName).SendAsync("ReceiveGroupNotification", $"[System] User {Context.ConnectionId} đã rời group {groupName}.");
            await Clients.Caller.SendAsync("ReceiveSystemNotification", $"[System] Bạn đã rời group {groupName}.");
        }

        // On: Lắng nghe client yêu cầu broadcast thông báo
        public async Task BroadcastNotification(string user, string notification)
        {
            await Clients.All.SendAsync("ReceiveSystemNotification", $"[Broadcast từ {user}] {notification}");
            await Clients.Caller.SendAsync("ReceiveSystemNotification", $"[System] Bạn đã gửi thông báo broadcast.");
        }
    }
}