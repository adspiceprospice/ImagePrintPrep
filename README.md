# PrintPrep

PrintPrep is an open-source web application designed to help you prepare and arrange photos for printing on standard paper sizes. It automatically calculates the best layout, adds customizable white borders, and includes cutting guides so you can easily print multiple photos on a single sheet of paper without manual arrangement.

## Features

- **Smart Layout Engine**: Automatically calculates how many photos fit on your selected paper size and rotates them 90 degrees if it maximizes the number of photos per page.
- **Paper & Photo Sizes**: Supports standard paper sizes (A4, Letter, A3, Legal) and common photo sizes (4x6, 5x7, Wallet, Polaroid, Passport, etc.).
- **Customizable Borders**: Adjust the width of the white border around each photo.
- **Cutting Guides**: Automatically generates dashed cutting guides between photos for easy and precise trimming.
- **Batch Processing**: Upload multiple images at once and specify how many copies of each image you want to print.
- **Print-Ready**: Uses specialized CSS print media queries to ensure the physical print dimensions are perfectly accurate.

## Tech Stack

- [Next.js](https://nextjs.org/) (React Framework)
- [Tailwind CSS](https://tailwindcss.com/) (Styling)
- [Lucide React](https://lucide.dev/) (Icons)

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

## Printing Tips

For the best results when printing from the browser:
1. Set your printer to the exact **Paper Size** you selected in the app.
2. Set margins to **None** or **0**.
3. Set the scale to **100%** or **Actual Size** (do not use "Fit to Page").
4. Make sure to print from a full browser window (not inside an iframe preview).

## Author

Made by **Adrian@curiosityai.nl**

## License

This project is open-source and available under the [MIT License](LICENSE).
