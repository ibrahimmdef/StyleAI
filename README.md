# StyleAI — sadə struktur

React + JavaScript, Tailwind CSS, Lucide React və React Router.
Yalnız Home hazırlanıb. Başqa səhifələrin route-ları hazır boş səhifələrdir.

## İşə salmaq

```sh
npm install
npm run dev
```

Yoxlama: `npm test` və `npm run build`.
Node.js 20.19+ və ya 22.12+ istifadə et.

## Hansı iş haradadır?

| Fayl | İçində nə var? |
| --- | --- |
| `src/main.jsx` | React-i və Router-i başladır, index.css-i import edir. |
| `src/App.jsx` | Ümumi layout, route-lar və digər səhifələrin placeholder-ları. |
| `src/pages/Home.jsx` | Bütün Home state-ləri və əməliyyatları: geyim dəyişmə, generasiya, saxlama, favoritlər, bildiriş. Hava və səbəb kartları da bu faylın altındadır. |
| `src/components/Sidebar.jsx` | Sidebar, logo və mobil menyu. |
| `src/components/OutfitPreview.jsx` | Kombin kartı, geyimlərin düzülüşü, jaketli/jaketsiz grid və dəyişmə düymələri. |
| `src/components/ItemPicker.jsx` | Geyim seçmə pəncərəsi: axtarış, seç, Apply, Cancel, Escape. |
| `src/components/Buttons.jsx` | Adi düymə və ikon düyməsi. |
| `src/data.js` | Geyim siyahısı, nümunə kombinlər, ID yoxlamaları və localStorage funksiyaları. |
| `src/index.css` | Tailwind, rənglər, font və container utility. |
| `public/images/` | Geyim şəkilləri. |
| `tests/data.test.js` | Məlumat və seçim məntiqinin 5 testi. |

## Ən çox dəyişəcəyin yerlər

- **Yeni geyim / şəkil:** `data.js` içində `wardrobeItems`.
- **Jaketli / jaketsiz görünüş:** `OutfitPreview.jsx` içində `layered` və `unlayered`.
- **AI qoşmaq:** `Home.jsx` içində `generate()`.
- **Canlı hava qoşmaq:** `Home.jsx` içində `WeatherCard()`.
- **Yeni səhifə:** `pages/` içində yarat, `App.jsx` içində route-u dəyiş.
- **Rənglər:** `index.css` içində `@theme`.

## Qeydlər

Generate hazır lokal kombinlər arasından seçir; AI bağlantısı yoxdur. Hava nümunədir.
Saxlama və favoritlər localStorage-dadır; serverə göndərilmir.
Şəkillər və Inter fontu lokal daxil edilib. Bəzi alternativ fotolar kiçik ölçülüdür.
Fontun lisenziyası `public/fonts/LICENSE.txt` faylındadır.

Hosting-də React Router üçün bütün səhifə URL-ləri index.html-a yönləndirilməlidir.
Netlify üçün `public/_redirects` daxildir.

## Yoxlama nəticəsi

Struktur sadələşdirildikdən sonra 5 avtomatik test və production build uğurla keçib.
Görünüş class-ları və mövcud funksionallıq saxlanılıb.
