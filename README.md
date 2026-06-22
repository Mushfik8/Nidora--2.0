# Nidora 🏡

Nidora is a modern, responsive rental marketplace for finding and listing verified flats, family rentals, bachelor pads, sublets, and rooms across Bangladesh, India, and Pakistan. It connects renters directly with property owners, featuring real-time messaging, comprehensive listing management, and a robust admin dashboard.

## 🌟 Key Features

- **Direct Connections:** Chat in real-time with property owners directly through the platform.
- **Real-Time Messaging:** Fully featured chat interface with instant updates and notification badges (like WhatsApp/Telegram).
- **Verified Listings:** Integrated verification system for property owners using document uploads (National ID, Driving License).
- **Responsive Design:** Mobile-first architecture with edge-to-edge mobile views, dynamic safe-area-insets, and seamless cross-platform experiences.
- **Smart Discovery:** Powerful browsing capabilities tailored for various property types (Flat, Family, Bachelor, Sublet, Room).
- **Favorites System:** Save and easily access preferred properties.
- **Admin Dashboard:** Tools for moderation, reviewing verification requests, and managing platform integrity.

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + Framer Motion
- **Database & Auth:** Firebase (Firestore, Authentication, Storage)
- **Icons & UI:** React Icons, react-hot-toast, Zustand for state

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A Firebase project with Firestore, Authentication, and Storage configured.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mushfik8/Nidora--2.0.git
   cd Nidora--2.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root of your project and add your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

- `/src/app` - Next.js App Router pages (Home, Admin, Messages, Profile, etc.)
- `/src/components` - Reusable UI components (Auth, Layout, Listings, UI elements)
- `/src/contexts` - React Context providers (AuthContext, UnreadContext)
- `/src/lib` - Utility functions and Firebase initialization
- `/src/types` - TypeScript interfaces and types for the data models

## 🔒 Security & Verification

Nidora includes a robust verification system where users submit documents (`national_id` or `driving_license`). Admins can review these requests via the Admin Dashboard to grant "Verified" status to owners, adding a badge to their profile and listings to build trust within the marketplace.

## 📜 License

This project is licensed under the MIT License.
