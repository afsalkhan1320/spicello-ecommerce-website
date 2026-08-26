const fs = require('fs');
const path = require('path');

const images = [
    {
        src: 'C:/Users/Arsath khan/.gemini/antigravity-ide/brain/e818572c-8f36-47f2-85e1-06523cbb3da3/turmeric_powder_1785326173837.png',
        dest: 'image1.jpg',
        name: 'Turmeric Powder'
    },
    {
        src: 'C:/Users/Arsath khan/.gemini/antigravity-ide/brain/e818572c-8f36-47f2-85e1-06523cbb3da3/chilli_powder_white_1785326383659.png',
        dest: 'image2.jpg',
        name: 'Chilli Powder'
    },
    {
        src: 'C:/Users/Arsath khan/.gemini/antigravity-ide/brain/e818572c-8f36-47f2-85e1-06523cbb3da3/coriander_powder_white_1785326401671.png',
        dest: 'image3.jpg',
        name: 'Coriander Powder'
    },
    {
        src: 'C:/Users/Arsath khan/.gemini/antigravity-ide/brain/e818572c-8f36-47f2-85e1-06523cbb3da3/cumin_powder_white_1785326421381.png',
        dest: 'image4.jpg',
        name: 'Cumin Powder'
    },
    {
        src: 'C:/Users/Arsath khan/.gemini/antigravity-ide/brain/e818572c-8f36-47f2-85e1-06523cbb3da3/pepper_powder_white_1785326441570.png',
        dest: 'image5.jpg',
        name: 'Pepper Powder'
    },
    {
        src: 'C:/Users/Arsath khan/.gemini/antigravity-ide/brain/e818572c-8f36-47f2-85e1-06523cbb3da3/fennel_powder_white_1785326459503.png',
        dest: 'image6.jpg',
        name: 'Fennel Powder'
    },
    {
        src: 'C:/Users/Arsath khan/.gemini/antigravity-ide/brain/e818572c-8f36-47f2-85e1-06523cbb3da3/garam_masala_white_1785326480223.png',
        dest: 'image7.jpg',
        name: 'Garam Masala'
    },
    {
        src: 'C:/Users/Arsath khan/.gemini/antigravity-ide/brain/e818572c-8f36-47f2-85e1-06523cbb3da3/cardamom_powder_white_1785326271405.png',
        dest: 'image8.jpg',
        name: 'Cardamom Powder'
    },
    {
        src: 'C:/Users/Arsath khan/.gemini/antigravity-ide/brain/e818572c-8f36-47f2-85e1-06523cbb3da3/ginger_powder_white_1785326290927.png',
        dest: 'image9.jpg',
        name: 'Ginger Powder'
    }
];

const destDir = path.join(__dirname, 'image');

// Ensure image directory exists
if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

images.forEach(img => {
    const destPath = path.join(destDir, img.dest);
    try {
        if (fs.existsSync(img.src)) {
            fs.copyFileSync(img.src, destPath);
            console.log(`Successfully updated image for [${img.name}] -> ${img.dest}`);
        } else {
            console.error(`Source image for [${img.name}] not found at: ${img.src}`);
        }
    } catch (err) {
        console.error(`Failed to copy image for [${img.name}]: ${err.message}`);
    }
});

console.log('All product images processed successfully!');
