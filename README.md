This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


### `User` 模型

这个模型用来存储应用中的用户信息。

- `id`: 用户的唯一标识符，一个自增的整数。
- `name`: 用户的名字，是可选的。
- `email`: 用户的电子邮箱，是唯一的，用于登录。
- `emailVerified`: 记录用户的邮箱是否已经验证，`next-auth` 在使用 OAuth 提供商时会自动处理这个字段。
- `image`: 用户的头像 URL，可选。
- `hashedPassword`: 存储用户加密后的密码，是可选的，因为用户也可能通过 OAuth 登录，这种情况下就没有密码。
- `createdAt`: 记录用户账号创建的时间。
- `updatedAt`: 记录用户账号信息最后一次更新的时间。
- `accounts`: 关联到 `Account` 模型，一个用户可以有多个关联账户（比如，一个邮箱登录，一个 GitHub 登录）。
- `sessions`: 关联到 `Session` 模型，记录用户的登录会话。

### `Account` 模型

这个模型是 `next-auth` 用来支持多种登录方式（比如 OAuth 提供商如 Google, GitHub）所必需的。

- `id`: 账户的唯一标识符。
- `userId`: 关联到 `User` 模型的 `id`，表示这个账户属于哪个用户。
- `type`: 账户类型（比如 `oauth`, `email`）。
- `provider`: 提供商的名称（比如 `google`, `github`）。
- `providerAccountId`: 用户在提供商那里的唯一 ID。
- `refresh_token`, `access_token`, `expires_at`, `token_type`, `scope`, `id_token`, `session_state`: 这些都是 OAuth 流程中可能用到的字段，用于存储不同提供商返回的令牌和状态信息。

### `Session` 模型

这个模型由 `next-auth` 用来管理用户的登录会话。

- `id`: 会话的唯一标识符。
- `sessionToken`: 会话令牌，是唯一的，用来在 cookie 中识别用户会话。
- `userId`: 关联到 `User` 模型的 `id`。
- `expires`: 会话的过期时间。
- `user`: 关联到 `User` 模型。

### `VerificationToken` 模型

这个模型由 `next-auth` 用于 "无密码" 登录（比如通过邮件链接登录）。

- `identifier`: 通常是用户的邮箱。
- `token`: 发送给用户的唯一令牌，是唯一的。
- `expires`: 令牌的过期时间。

希望这个解释能帮助你更好地理解数据库结构！如果你还有其他问题，随时可以问我。
