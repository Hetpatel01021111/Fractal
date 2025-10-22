# Next.js + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion

A modern React application built with the latest technologies for optimal development experience and performance.

## 🚀 Tech Stack

- **[Next.js 15](https://nextjs.org)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful and accessible UI components
- **[Framer Motion](https://www.framer.com/motion/)** - Production-ready motion library

## ✨ Features

- ⚡ **Next.js 15** with App Router and Server Components
- 🎯 **TypeScript** for type safety and better developer experience
- 🎨 **Tailwind CSS** for responsive and utility-first styling
- 🧩 **shadcn/ui** components for consistent and accessible UI
- 🎭 **Framer Motion** for smooth animations and transitions
- 🌙 **Dark mode** support built-in
- 📱 **Fully responsive** design
- 🔥 **Hot reload** for instant development feedback

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd searchengine
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page with demo
├── components/
│   └── ui/                # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
└── lib/
    └── utils.ts           # Utility functions
```

## 🎨 Adding shadcn/ui Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
```

## 🎭 Animation Examples

The project includes several Framer Motion animation examples:

- **Page transitions** with staggered animations
- **Hover effects** on interactive elements
- **List animations** with enter/exit transitions
- **Scale and rotation** effects on cards

## 🎯 Development

### Key Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Customization

- **Styling**: Modify `tailwind.config.ts` for custom Tailwind configuration
- **Components**: Add new components in `src/components/`
- **Animations**: Use Framer Motion for custom animations
- **Theme**: Customize colors and styling in `src/app/globals.css`

## 📚 Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub Repository](https://github.com/vercel/next.js)

### Other Technologies
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 🚀 Deployment

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with zero configuration

### Other Platforms

This project can be deployed on any platform that supports Node.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vercel](https://vercel.com/) for Next.js
- [Tailwind Labs](https://tailwindcss.com/) for Tailwind CSS
- [shadcn](https://twitter.com/shadcn) for the amazing UI components
- [Framer](https://www.framer.com/) for Framer Motion
