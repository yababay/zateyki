<script>

    import Map from 'ol/Map.js';
    import View from 'ol/View.js';
    import ImageLayer from 'ol/layer/Image.js';
    import Projection from 'ol/proj/Projection.js';
    import Static from 'ol/source/ImageStatic.js';
    import Home from '$lib/components/Home.svelte'

    import { onMount } from 'svelte';

    export let data

    const { key, title, width, height } = data

    onMount(() => {

        // Define the image dimensions and URL
        //const width = 14055; // Replace with your image width
        //const height = 9449; // Replace with your image height
        const imageUrl = `/maps/${key}.jpg`; // Replace with your image path

        // Define the extent of the image in the custom projection (pixel coordinates)
        const extent = [0, 0, width, height];

        // Create a custom projection
        const projection = new Projection({
            code: 'image',
            units: 'pixels',
            extent: extent,
        });

        // Create the map
        const map = new Map({
            target: 'map',
            layers: [
                new ImageLayer({
                source: new Static({
                    url: imageUrl,
                    projection: projection,
                    imageExtent: extent,
                }),
                }),
            ],
            view: new View({
                projection: projection,
                center: [width / 2, height / 2], // Center the map on the image center
                zoom: 2, // Adjust initial zoom level as needed
                minZoom: 0,
                maxZoom: 4, // Set max zoom based on image resolution
            }),
        });    
    })

</script>

<section id="map"></section>

<Home right={true} />

<svelte:head>
    <title>{title}</title>
</svelte:head>
