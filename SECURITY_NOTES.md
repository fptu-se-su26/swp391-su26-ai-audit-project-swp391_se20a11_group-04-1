# Security Notes — Resource Management Feature

## 🔴 Critical Security Issue: WebSocket Authentication

**Location:** `NotificationWebSocketHandler.java`

**Current behavior:**
```java
// URL: ws://host/api/ws/notifications?userId=123
Long userId = Long.parseLong(queryParam["userId"]);
```

Any unauthenticated client can connect with an arbitrary `userId` and receive:
- Private user notifications
- Resource management snapshots (intended for admins only)
- User lock/unlock events
- Project invitations
- Test run progress

**Attack scenario:**
```js
// Attacker script
const ws = new WebSocket('ws://target.com/api/ws/notifications?userId=1'); // impersonate admin
ws.onmessage = (e) => console.log('Admin sees:', e.data);
```

**Recommended fix (requires backend refactor):**

1. Validate session token instead of query param:
```java
@Override
public void afterConnectionEstablished(WebSocketSession session) {
    String token = extractTokenFromHeaders(session);
    Long userId = validateTokenAndGetUserId(token); // OAuth2/JWT validation
    if (userId == null) {
        session.close(CloseStatus.NOT_ACCEPTABLE);
        return;
    }
    userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(session);
}
```

2. For admin-only resources (like `RESOURCE_SNAPSHOT`), filter by role:
```java
public static void broadcastToAdmins(String payload) {
    userSessions.forEach((userId, sessions) -> {
        if (!isAdmin(userId)) return; // role check
        sessions.forEach(session -> /* send */);
    });
}
```

**Why not fixed now:**
- Requires touching auth infrastructure (session/token validation) across the entire WS lifecycle
- Current frontend assumes userId from localStorage without auth header
- Needs coordination with frontend auth store to pass tokens

**Temporary mitigation:**
- Deploy behind a firewall (block external WS access)
- Use network-level auth (VPN, IP whitelist)
- Rotate session IDs frequently (1hr TTL)

---

**Date:** 2026-07-09  
**Author:** Kiro AI Assistant  
**Status:** KNOWN ISSUE — Pending auth refactor
