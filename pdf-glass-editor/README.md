# 📄 Glass PDF Editor

> **Minimal. Secure. Serverless.**
> A powerful, browser-based PDF manipulation tool built with a futuristic Glassmorphism UI.

![Glass PDF Editor Banner](public/file.svg) ## 🚀 Live Demo
Check out the live application here: **[Glass PDF Editor](https://priyanshrajbhar.vercel.app/)**

---

## 📖 About Project (Project Kya Hai?)

**Glass PDF Editor** ek modern web application hai jo PDF files ko edit, merge, split aur secure karne ke liye banaya gaya hai. Iska sabse bada feature **"Privacy"** hai. Ye poori tarah se **Client-Side (Browser)** par chalta hai. Matbal, user ki koi bhi file server par upload nahi hoti; saara kaam user ke device par hi hota hai.

Iska UI **Glassmorphism** style mein design kiya gaya hai jo ise visually premium aur clean banata hai.

---

## 🛠️ Tech Stack (Humne Kya Use Kiya?)

Is project ko banane ke liye humne latest aur fastest web technologies ka use kiya hai:

* **Framework:** [Next.js 16 (App Router)](https://nextjs.org/) - React ka sabse powerful framework.
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Modern styling ke liye.
* **Animations:** [Framer Motion](https://www.framer.com/motion/) - Smooth transitions aur hover effects ke liye.
* **PDF Logic:** [pdf-lib](https://pdf-lib.js.org/) - PDF create aur modify karne ke liye.
* **PDF Rendering:** [react-pdf](https://github.com/wojtekmaj/react-pdf) - PDF ko browser mein dikhane ke liye.
* **Drag & Drop:** [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) - Merge list ko reorder karne ke liye.
* **Signature:** [react-signature-canvas](https://github.com/agilgur5/react-signature-canvas) - Digital signature draw karne ke liye.
* **PWA:** [@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa) - App ko installable banane ke liye.
* **Notifications:** [react-hot-toast](https://react-hot-toast.com/) - Beautiful alert popups ke liye.
* **Language:** TypeScript - Type safety aur error-free code ke liye.

---

## ✨ Features (Kya Kya Kar Sakta Hai?)

Humne isme wo saare tools daale hain jo ek Professional PDF Editor mein hone chahiye:

1.  **📄 Merge PDF:** Multiple PDFs ko jodna. Drag & drop karke unka order change kar sakte hain.
2.  **✂️ Split PDF:** Badi PDF se specific pages nikalna (e.g., "1-5, 8").
3.  **🖼️ Image to PDF:** JPG/PNG photos ko PDF mein convert karna.
4.  **✍️ e-Sign PDF:** Apne haath se signature draw karke PDF par lagana.
5.  **🔒 Protect PDF:** File par Password lagana (AES-256 Encryption).
6.  **💧 Watermark:** PDF par "Confidential" ya koi bhi text diagonally lagana.
7.  **🔢 Page Numbers:** Har page ke neeche automatic "1 of X" number lagana.
8.  **⚡ Compress PDF:** File size ko optimize karna.
9.  **🔄 Rotate:** Pages ko 90 degree rotate karna.
10. **📱 PWA Support:** Isse Mobile/Laptop par Native App ki tarah install kar sakte hain (Offline Support).

---

## 📅 Development Journey (Kaise Banaya?)

Humne is project ko Step-by-Step develop kiya hai taaki har feature perfect ho:

### Phase 1: UI & Structure 🎨
* Sabse pehle **Glassmorphism Theme** set ki (Dark mode, blurred backgrounds, gradients).
* Responsive Grid Layout banaya taaki Mobile aur Desktop par sahi dikhe.
* Tailwind Config update ki taaki custom colors aur animations chalein.

### Phase 2: Core Logic Implementation 🧠
* **`pdf-lib`** ko integrate kiya backend logic ke liye.
* `rotatePDF`, `mergePDFs` jaise functions likhe jo `ArrayBuffer` ke saath kaam karte hain.
* File downloading ke liye `downloadjs` ka use kiya.

### Phase 3: Smart PDF Viewer 👁️
* `react-pdf` ka use karke **Custom Viewer** banaya.
* **Zoom In/Out**, **Fit Width** aur **Page Navigation** ke liye Floating Toolbar banaya.
* Toolbar ko Top par fix kiya taaki wo content ke upar na aaye.

### Phase 4: Advanced Features 🚀
* **Drag & Drop:** Merge tool mein Re-ordering feature dala.
* **Signature Pad:** Canvas implement kiya jahan user sign kar sake.
* **Multi-format Support:** Image upload logic handle kiya.

### Phase 5: Bug Fixes & Optimization 🐛
Humne development ke dauran kaafi challenges face kiye aur unhe fix kiya:
* **Fixed:** `pdfDoc.encrypt is not a function` error ko `pdf-lib` version update karke solve kiya.
* **Fixed:** `react-pdf` toolbar flickering issue ko `z-index` aur state management se theek kiya.
* **Fixed:** PWA Build Error (Next.js 16 Turbopack conflict) ko `--webpack` flag use karke resolve kiya.
* **Fixed:** TypeScript errors for missing types (`downloadjs`).

---

## ⚙️ Installation (Local Setup)

Agar aap is project ko apne computer par run karna chahte hain:

1.  **Clone the Repo:**
    ```bash
    git clone [https://github.com/priyansh-86/pdf-glass-editor.git](https://github.com/priyansh-86/pdf-glass-editor.git)
    cd pdf-glass-editor
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

4.  **Open Browser:**
    Go to `http://localhost:3000`

---

## 🤝 Connect with Developer

Built with ❤️ by **Priyansh**.

* 🌐 **Portfolio:** [https://priyanshrajbhar.vercel.app/](https://priyanshrajbhar.vercel.app/)
* 🐙 **GitHub:** [@priyansh-86](https://github.com/priyansh-86)
* 📸 **Instagram:** [@priyansh__.86](https://instagram.com/priyansh__.86)
* 🐦 **X (Twitter):** [@priyansh_86](https://x.com/priyansh_86)
* ✈️ **Telegram:** [@priyansh_dev](https://t.me/priyansh_dev)
* 📧 **Email:** [priyanshrajbhar499@gmail.com](mailto:priyanshrajbhar499@gmail.com)

---

### 📜 License
This project is open-source and available under the **MIT License**.