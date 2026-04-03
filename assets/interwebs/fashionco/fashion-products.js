// ==========================================
// Scales & Tails Fashion Co. — Product Catalog
// 19 Products, 79 Variants across 5 Departments
// ==========================================

var FASHION_PRODUCTS = [

    // ==========================================
    // TOPS DEPARTMENT
    // ==========================================

    {
        id: 'weekend-tee',
        name: 'The Weekend Tee',
        type: 'tee',
        department: 'tops',
        description: 'Your go-to crew-neck for lazy Saturdays in Snakesia. Soft cotton, easy fit, zero effort required.',
        price: 17.49,
        giftable: true,
        variants: [
            {
                variantId: 'weekend-tee-purple',
                color: 'Purple',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'shirt - tee - style A - plain - neutral - purple.jpg'
            },
            {
                variantId: 'weekend-tee-green',
                color: 'Green',
                colorFamily: 'neutral',
                pattern: 'patterned',
                motifs: [],
                image: 'shirt - tee - style A - patterned - white - green.jpg'
            },
            {
                variantId: 'weekend-tee-animals',
                color: 'Blue & Brown',
                colorFamily: 'neutral',
                pattern: 'patterned',
                motifs: ['animals'],
                image: 'shirt - tee - style A - patterned - white - blue - brown - animals.jpg'
            },
            {
                variantId: 'weekend-tee-unicorns',
                color: 'Purple',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['unicorns', 'rainbows'],
                image: 'shirt - tee - style A - patterned - purple - rainbows - unicorns.jpg'
            },
            {
                variantId: 'weekend-tee-butterflies',
                color: 'Purple',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['rainbows', 'butterflies'],
                image: 'shirt - tee - style A - patterned - bright - purple - rainbows - butterflies.jpg'
            },
            {
                variantId: 'weekend-tee-space',
                color: 'Blue',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['space'],
                image: 'shirt - tee - style A - patterned - bright - blue - space.jpg'
            },
            {
                variantId: 'weekend-tee-pink-blue',
                color: 'Pink & Blue',
                colorFamily: 'pastel',
                pattern: 'patterned',
                motifs: [],
                image: 'shirt- tee - style A patterned - pink - blue.jpg'
            }
        ]
    },

    {
        id: 'fairway-polo',
        name: 'The Fairway Polo',
        type: 'polo',
        department: 'tops',
        description: 'Crisp collar, classic fit. Whether you\'re hitting the links or just looking sharp at brunch.',
        price: 22.49,
        giftable: true,
        variants: [
            {
                variantId: 'fairway-polo-pastel-blue',
                color: 'Pastel Blue',
                colorFamily: 'pastel',
                pattern: 'plain',
                motifs: [],
                image: 'shirt - polo - style A - plain - pastel - blue.jpg'
            },
            {
                variantId: 'fairway-polo-bright-blue',
                color: 'Blue',
                colorFamily: 'bright',
                pattern: 'plain',
                motifs: [],
                image: 'shirt - polo - style A - plain - bright - blue.jpg'
            },
            {
                variantId: 'fairway-polo-gray',
                color: 'Gray',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'shirt - polo  - style A - plain - neutral - gray.jpg'
            },
            {
                variantId: 'fairway-polo-birds',
                color: 'Blue & Green',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['birds'],
                image: 'shirt - polo - style A - patterned - stripes - bright - blue  - yellow - green - birds.jpg'
            }
        ]
    },

    {
        id: 'daydream-tunic',
        name: 'Daydream Tunic',
        type: 'tunic',
        department: 'tops',
        description: 'Flowy and free — like a daydream you can wear. Perfect for exploring the Snakesian countryside.',
        price: 27.49,
        giftable: true,
        variants: [
            {
                variantId: 'daydream-tunic-green',
                color: 'Green',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'shirt - tunic - style A - plain - neutral - green.jpg'
            },
            {
                variantId: 'daydream-tunic-pink-animals',
                color: 'Pink',
                colorFamily: 'pastel',
                pattern: 'patterned',
                motifs: ['animals'],
                image: 'shirt - tunic - style A - patterned - pink - animals.jpg'
            },
            {
                variantId: 'daydream-tunic-green-animals',
                color: 'Green',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['animals'],
                image: 'shirt - tunic - style A - patterned - bright - green - animals.jpg'
            },
            {
                variantId: 'daydream-tunic-mermaids',
                color: 'Blue',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['mermaids'],
                image: 'shirt - tunic - style A - patterned - bright - blue - mermaids.jpg'
            }
        ]
    },

    {
        id: 'overcast-tunic',
        name: 'The Overcast Tunic',
        type: 'tunic',
        department: 'tops',
        description: 'Cozy layers for when the Snakesian clouds roll in. Looks great with everything, even pajama pants.',
        price: 29.99,
        giftable: true,
        variants: [
            {
                variantId: 'overcast-tunic-purple',
                color: 'Purple',
                colorFamily: 'pastel',
                pattern: 'plain',
                motifs: [],
                image: 'shirt - tunic - style B - plain - pastel - purple.jpg'
            },
            {
                variantId: 'overcast-tunic-white',
                color: 'White',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'shirt - tunic - style B - plain - neutral - white.jpg'
            },
            {
                variantId: 'overcast-tunic-yellow',
                color: 'Yellow',
                colorFamily: 'bright',
                pattern: 'plain',
                motifs: [],
                image: 'shirt - tunic - style B - plain - bright - yellow.jpg'
            },
            {
                variantId: 'overcast-tunic-pink-yellow-blue',
                color: 'Pink, Yellow & Blue',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: [],
                image: 'shirt - tunic - style B - patterned - bright - pink  - yellow - blue.jpg'
            },
            {
                variantId: 'overcast-tunic-multi',
                color: 'Multi',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: [],
                image: 'shirt - tunic - style B - patterned - bright - blue - red - green - purple.jpg'
            }
        ]
    },

    {
        id: 'morning-light-blouse',
        name: 'Morning Light Blouse',
        type: 'blouse',
        department: 'tops',
        description: 'Delicate details and a breezy silhouette. The kind of top that gets compliments at the Snakesian market.',
        price: 32.49,
        giftable: true,
        variants: [
            {
                variantId: 'morning-light-blouse-white',
                color: 'White',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'shirt - blouse - style A - plain - neutral -  white.jpg'
            },
            {
                variantId: 'morning-light-blouse-sweets',
                color: 'Pink & Blue',
                colorFamily: 'pastel',
                pattern: 'patterned',
                motifs: ['sweets'],
                image: 'shirt - blouse - style A - patterned - white - pink - blue - sweets.jpg'
            },
            {
                variantId: 'morning-light-blouse-blue-brown',
                color: 'Blue & Brown',
                colorFamily: 'neutral',
                pattern: 'patterned',
                motifs: [],
                image: 'shirt - blouse - style A - patterned - white - blue - brown.jpg'
            },
            {
                variantId: 'morning-light-blouse-yellow',
                color: 'Yellow',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: [],
                image: 'shirt - blouse - style A - patterned - bright - yellow.jpg'
            },
            {
                variantId: 'morning-light-blouse-unicorns',
                color: 'White',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['unicorns'],
                image: 'shirt - blouse - style A - patterned - bright - white - unicorns.jpg'
            }
        ]
    },

    // ==========================================
    // DRESSES DEPARTMENT
    // ==========================================

    {
        id: 'storybook-dress',
        name: 'The Storybook Dress',
        type: 'dress',
        department: 'dresses',
        description: 'Once upon a time, there was a dress so cute it sold out three times. This is that dress.',
        price: 39.99,
        giftable: true,
        variants: [
            {
                variantId: 'storybook-dress-sweets',
                color: 'Black & Red',
                colorFamily: 'neutral',
                pattern: 'patterned',
                motifs: ['stripes', 'sweets'],
                image: 'dress - style A - patterned - stripes - neutral - black - white - red - sweets.jpg'
            },
            {
                variantId: 'storybook-dress-rainbows',
                color: 'Pink',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['rainbows'],
                image: 'dress - style A - patterned - pink - rainbows.jpg'
            }
        ]
    },

    {
        id: 'candy-stripe',
        name: 'The Candy Stripe',
        type: 'dress',
        department: 'dresses',
        description: 'Sweet as a Snakesian candy shop. Pink stripes that turn heads at every birthday party.',
        price: 42.49,
        giftable: true,
        variants: [
            {
                variantId: 'candy-stripe-pink',
                color: 'Pink',
                colorFamily: 'pastel',
                pattern: 'patterned',
                motifs: ['stripes'],
                image: 'dress - style B - patterned - stripes - pink.jpg'
            }
        ]
    },

    {
        id: 'twilight-ruffle-dress',
        name: 'Twilight Ruffle Dress',
        type: 'dress',
        department: 'dresses',
        description: 'Ruffled layers that catch the evening breeze. Best worn while watching the sunset over Dusty Flats.',
        price: 44.99,
        giftable: true,
        variants: [
            {
                variantId: 'twilight-ruffle-purple',
                color: 'Purple',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: [],
                image: 'dress - style C - patterned - purple.jpg'
            },
            {
                variantId: 'twilight-ruffle-white-flowers',
                color: 'White',
                colorFamily: 'neutral',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'dress - style C - patterned - neutral - white - flowers.jpg'
            }
        ]
    },

    {
        id: 'carousel-dress',
        name: 'The Carousel Dress',
        type: 'dress',
        department: 'dresses',
        description: 'Spin-worthy and full of color. Named after the famous carousel in downtown Serpentine Estates.',
        price: 47.49,
        giftable: true,
        variants: [
            {
                variantId: 'carousel-dress-pink-yellow-blue',
                color: 'Pink, Yellow & Blue',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: [],
                image: 'dress - style D - patterned - pink - yellow - blue.jpg'
            },
            {
                variantId: 'carousel-dress-multi',
                color: 'Multi',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: [],
                image: 'dress - style D - patterned - bright - green - blue - yellow - orange - purple.jpg'
            },
            {
                variantId: 'carousel-dress-blue-flowers',
                color: 'Blue',
                colorFamily: 'pastel',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'dress - style D - patterned - blue - flowers.jpg'
            },
            {
                variantId: 'carousel-dress-denim',
                color: 'Denim Blue',
                colorFamily: 'neutral',
                pattern: 'patterned',
                motifs: [],
                image: 'dress - style D - jeans - patterned - neutral - blue.jpg'
            }
        ]
    },

    {
        id: 'meadow-dress',
        name: 'The Meadow Dress',
        type: 'dress',
        department: 'dresses',
        description: 'Fields of flowers, stitched into fabric. The official dress of Snakesian picnic season.',
        price: 49.99,
        giftable: true,
        variants: [
            {
                variantId: 'meadow-dress-purple-flowers',
                color: 'Purple',
                colorFamily: 'pastel',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'dress - style E - patterned - white - purple - flowers.jpg'
            },
            {
                variantId: 'meadow-dress-unicorns',
                color: 'Pink',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['unicorns', 'rainbows'],
                image: 'dress - style E - patterned - white - pink - unicorns - rainbows.jpg'
            },
            {
                variantId: 'meadow-dress-pink-yellow-flowers',
                color: 'Pink & Yellow',
                colorFamily: 'neutral',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'dress - style E - patterned - neutral - pink - yellow - white - flowers.jpg'
            }
        ]
    },

    {
        id: 'polka-dot-party',
        name: 'Polka Dot Party',
        type: 'dress',
        department: 'dresses',
        description: 'Dots so fun they should be illegal. Perfect for every celebration in the Snakesian calendar.',
        price: 44.99,
        giftable: true,
        variants: [
            {
                variantId: 'polka-dot-yellow-flowers',
                color: 'Yellow',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'dress - style F - patterned - yellow - flowers.jpg'
            },
            {
                variantId: 'polka-dot-red',
                color: 'Red',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['dots'],
                image: 'dress - style F - patterned - dots - red.jpg'
            },
            {
                variantId: 'polka-dot-blue',
                color: 'Blue',
                colorFamily: 'neutral',
                pattern: 'patterned',
                motifs: ['dots'],
                image: 'dress - style F - patterned - dots - neutral - blue.jpg'
            }
        ]
    },

    {
        id: 'flutter-dress',
        name: 'The Flutter Dress',
        type: 'dress',
        department: 'dresses',
        description: 'Light as a butterfly wing, twice as beautiful. Our bestseller for three seasons running.',
        price: 52.49,
        giftable: true,
        variants: [
            {
                variantId: 'flutter-dress-purple',
                color: 'Purple',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: [],
                image: 'dress - style G - patterned - purple.jpg'
            },
            {
                variantId: 'flutter-dress-pink',
                color: 'Pink',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: [],
                image: 'dress - style G - patterned - pink.jpg'
            },
            {
                variantId: 'flutter-dress-neutral-pink',
                color: 'Blush',
                colorFamily: 'neutral',
                pattern: 'patterned',
                motifs: [],
                image: 'dress - style G - patterned - neutral - pink.jpg'
            },
            {
                variantId: 'flutter-dress-butterflies',
                color: 'Blue',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['butterflies'],
                image: 'dress - style G - patterned - blue - butterflies.jpg'
            }
        ]
    },

    // ==========================================
    // BOTTOMS DEPARTMENT
    // ==========================================

    {
        id: 'kickflip-shorts',
        name: 'Kickflip Shorts',
        type: 'shorts',
        department: 'bottoms',
        description: 'Built for skateparks, worn everywhere. The official shorts of Snakesian summer.',
        price: 19.99,
        giftable: true,
        variants: [
            {
                variantId: 'kickflip-shorts-black',
                color: 'Black',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'shorts - style A - plain - neutral - black.jpg'
            },
            {
                variantId: 'kickflip-shorts-blue',
                color: 'Blue',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: [],
                image: 'shorts - style A - patterned - blue.jpg'
            },
            {
                variantId: 'kickflip-shorts-white-blue',
                color: 'White & Blue',
                colorFamily: 'pastel',
                pattern: 'patterned',
                motifs: [],
                image: 'shorts - style A - patterned - white - blue.jpg'
            },
            {
                variantId: 'kickflip-shorts-skateboards',
                color: 'Pink & Blue',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['skateboards'],
                image: 'shorts - style A - patterned - pink - blue - skateboards.jpg'
            },
            {
                variantId: 'kickflip-shorts-yellow-skates',
                color: 'Yellow',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['skates', 'stars'],
                image: 'shorts - style A - patterned - bright - yellow - skates - stars.jpg'
            },
            {
                variantId: 'kickflip-shorts-pink-sweets',
                color: 'Pink',
                colorFamily: 'pastel',
                pattern: 'patterned',
                motifs: ['sweets'],
                image: 'shorts - style A -  patterned - pink - sweets.jpg'
            },
            {
                variantId: 'kickflip-shorts-denim',
                color: 'Denim Blue',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['skateboards'],
                image: 'shorts - style A - jeans - patterned - bright - blue - skateboards.jpg'
            }
        ]
    },

    {
        id: 'easy-stride-pant',
        name: 'The Easy Stride Pant',
        type: 'pants',
        department: 'bottoms',
        description: 'Stretchy, comfy, and surprisingly stylish. These pants have seen every corner of Snakesia.',
        price: 34.99,
        giftable: true,
        variants: [
            {
                variantId: 'easy-stride-flowers',
                color: 'Pink & Yellow',
                colorFamily: 'pastel',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'pants - style A - patterned - pink - yellow - flowers.jpg'
            },
            {
                variantId: 'easy-stride-orange',
                color: 'Orange',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: [],
                image: 'pants - style A - patterned - orange.jpg'
            },
            {
                variantId: 'easy-stride-orange-flowers',
                color: 'Orange',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'pants - style A - patterned - orange - flowers.jpg'
            },
            {
                variantId: 'easy-stride-dino',
                color: 'Orange',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['dinosaurs'],
                image: 'pants - style A - patterned - bright - orange - dinosaurs.jpg'
            },
            {
                variantId: 'easy-stride-jeans',
                color: 'Denim Blue',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'pants - style A - jeans - plain - neutral - blue.jpg'
            },
            {
                variantId: 'easy-stride-jeans-flowers',
                color: 'Denim Blue',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'pants - style A - jeans - patterned - bright - blue- flowers.jpg'
            }
        ]
    },

    {
        id: 'sunday-skirt',
        name: 'Sunday Skirt',
        type: 'skirt',
        department: 'bottoms',
        description: 'Named after the Snakesian tradition of Sunday market strolls. Twirl-tested and approved.',
        price: 29.99,
        giftable: true,
        variants: [
            {
                variantId: 'sunday-skirt-yellow-orange',
                color: 'Yellow & Orange',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'skirt - style A - plain - neutral - yellow - orange.jpg'
            },
            {
                variantId: 'sunday-skirt-green-flowers',
                color: 'Green',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'skirt - style A - patterned - green - flowers.jpg'
            },
            {
                variantId: 'sunday-skirt-dots',
                color: 'Multi',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['dots'],
                image: 'skirt - style A - patterned - dots - bright - blue - red - yellow.jpg'
            },
            {
                variantId: 'sunday-skirt-pink-blue-flowers',
                color: 'Pink & Blue',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'skirt - style A - patterned - bright - pink - blue -- flowers.jpg'
            }
        ]
    },

    // ==========================================
    // SWIMWEAR DEPARTMENT
    // ==========================================

    {
        id: 'coastline-trunk',
        name: 'The Coastline Trunk',
        type: 'swim',
        department: 'swimwear',
        description: 'Designed for the shores of Lake Serpentine. Quick-dry fabric, maximum splash potential.',
        price: 27.49,
        giftable: true,
        variants: [
            {
                variantId: 'coastline-trunk-pastel-green',
                color: 'Pastel Green',
                colorFamily: 'pastel',
                pattern: 'plain',
                motifs: [],
                image: 'swim - style A - plain - pastel - green.jpg'
            },
            {
                variantId: 'coastline-trunk-brown',
                color: 'Brown',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'swim - style A- plain - neutral - brown.jpg'
            },
            {
                variantId: 'coastline-trunk-orange',
                color: 'Orange',
                colorFamily: 'bright',
                pattern: 'plain',
                motifs: [],
                image: 'swim - style A- plain - bright - orange.jpg'
            },
            {
                variantId: 'coastline-trunk-beach-blue-orange',
                color: 'Blue & Orange',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['beach'],
                image: 'swim - style A -patterned - bright - blue - orange - beach.jpg'
            },
            {
                variantId: 'coastline-trunk-beach-blue-green',
                color: 'Blue & Green',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['beach'],
                image: 'swim - style A - patterned - bright - blue - green - beach.jpg'
            }
        ]
    },

    {
        id: 'splash-zone-swim',
        name: 'Splash Zone Swim',
        type: 'swim',
        department: 'swimwear',
        description: 'Cannonball-ready and pool-party approved. Comes with an unofficial license to make waves.',
        price: 29.99,
        giftable: true,
        variants: [
            {
                variantId: 'splash-zone-pastel-purple',
                color: 'Pastel Purple',
                colorFamily: 'pastel',
                pattern: 'plain',
                motifs: [],
                image: 'swim - style B - plain - pastel - purple.jpg'
            },
            {
                variantId: 'splash-zone-green',
                color: 'Green',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'swim - style B - plain - neutral - green.jpg'
            },
            {
                variantId: 'splash-zone-pink-orange',
                color: 'Pink & Orange',
                colorFamily: 'bright',
                pattern: 'plain',
                motifs: [],
                image: 'swim - style B - plain - bright - pink - orange.jpg'
            },
            {
                variantId: 'splash-zone-flowers-pink-yellow-blue',
                color: 'Pink, Yellow & Blue',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'swim - style B - patterned - bright - pink  - yellow - blue - flowers.jpg'
            },
            {
                variantId: 'splash-zone-flowers-blue-pink-orange',
                color: 'Blue, Pink & Orange',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['flowers'],
                image: 'swim - style B - patterned - bright - blue - pink - orange- flowers.jpg'
            }
        ]
    },

    // ==========================================
    // FORMAL DEPARTMENT
    // ==========================================

    {
        id: 'power-blazer',
        name: 'The Power Blazer',
        type: 'blazer',
        department: 'formal',
        description: 'Boardroom-ready in Snakesia or anywhere else. Mr. Snake-e owns seven of these.',
        price: 59.99,
        giftable: true,
        variants: [
            {
                variantId: 'power-blazer-pastel-blue',
                color: 'Pastel Blue',
                colorFamily: 'pastel',
                pattern: 'plain',
                motifs: [],
                image: 'blazer - style A - plain - pastel - blue.jpg'
            },
            {
                variantId: 'power-blazer-navy',
                color: 'Navy',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'blazer - style A - plain - neutral - blue.jpg'
            },
            {
                variantId: 'power-blazer-green-pink',
                color: 'Green & Pink',
                colorFamily: 'bright',
                pattern: 'plain',
                motifs: [],
                image: 'blazer - style A - plain - bright - green - pink.jpg'
            },
            {
                variantId: 'power-blazer-birds-space',
                color: 'Multi',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: ['birds', 'space'],
                image: 'blazer - style A - patterned - bright - blue - red - yellow - green -- birds - space.jpg'
            }
        ]
    },

    {
        id: 'classic-knot',
        name: 'The Classic Knot',
        type: 'tie',
        department: 'formal',
        description: 'A proper Snakesian tie for proper Snakesian occasions. Windsor knot not included (but recommended).',
        price: 12.49,
        giftable: true,
        variants: [
            {
                variantId: 'classic-knot-red-pink',
                color: 'Red & Pink',
                colorFamily: 'pastel',
                pattern: 'plain',
                motifs: [],
                image: 'tie - plain - pastel - red - pink.jpg'
            },
            {
                variantId: 'classic-knot-black',
                color: 'Black',
                colorFamily: 'neutral',
                pattern: 'plain',
                motifs: [],
                image: 'tie - plain - neutral - black.jpg'
            },
            {
                variantId: 'classic-knot-green',
                color: 'Green',
                colorFamily: 'bright',
                pattern: 'plain',
                motifs: [],
                image: 'tie - plain - bright - green.jpg'
            },
            {
                variantId: 'classic-knot-purple',
                color: 'Purple',
                colorFamily: 'bright',
                pattern: 'patterned',
                motifs: [],
                image: 'tie - patterned - bright - purple.jpg'
            }
        ]
    }
];

// Department display names
var FASHION_DEPARTMENTS = {
    all: 'All',
    tops: 'Tops',
    dresses: 'Dresses',
    bottoms: 'Bottoms',
    swimwear: 'Swimwear',
    formal: 'Formal'
};
