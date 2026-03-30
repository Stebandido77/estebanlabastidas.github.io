# estebanlabastidas.github.io

Personal academic and professional website for Esteban Labastidas.

## Publishing on GitHub Pages

1. Push this repository to GitHub under the name `estebanlabastidas.github.io` (or your `<username>.github.io`).
2. Go to **Settings > Pages** in the repository.
3. Under **Source**, select **Deploy from a branch** and choose `main` / `root`.
4. The site will be live at `https://<username>.github.io` within a few minutes.

## Local Preview

Open `index.html` directly in your browser. No server required.

## Updating Content

- **Profile photo**: Replace `assets/img/profile-placeholder.svg` with your photo (JPG or WebP recommended). Update the `<img>` tag in `index.html`.
- **CV**: Replace `assets/docs/CV_Esteban_Labastidas.pdf` with an updated version.
- **Papers**: Copy an `<article class="paper">` block in the Working Papers section and edit the title, date, abstract, and links.
- **Experience / Education / Projects**: Copy an existing entry block and edit the content.

## Structure

```
index.html          Main page (all sections)
style.css           Styles and responsive design
script.js           Navigation, mobile menu, scroll animations
assets/
  img/              Profile photo
  docs/             CV and other documents
```

## Dependencies

- [Google Fonts](https://fonts.google.com/) (Cormorant Garamond + Inter) loaded via CDN
- No frameworks, no build tools, no backend
