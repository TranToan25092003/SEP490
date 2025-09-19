### Using react + vite

### Css: Tailwind

### UI: Shacdn

### validation: Zod

### payment: Stripe

### const { getToken, isSignedIn } = useAuth(); // get token and check login

### const { getToken, isSignedIn, userId, orgRole, orgId } = useAuth(); all necessary

### custom fetch

```
const data = await customFetch.get("/", {
    headers: {
        Authorization: `Bearer ${token}`, // Gửi token trong header
    },
});

```

### Testing app healthy and get token

```
use this path
http://localhost:5173/test
```
