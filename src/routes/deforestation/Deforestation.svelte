<script lang="ts">

    import { onMount } from 'svelte'
    import gb from './uk-385x600.webp'

    const ENGLAND_SQUARE = 133_396 // Площадь Англии
    const WALES_SQUARE = 21_218 // Площадь Уэльса
    const BRITAIN_SQUARE = 242_495 // Площадь Великобритании
    const SQUARE_RATIO = (ENGLAND_SQUARE + WALES_SQUARE) / BRITAIN_SQUARE

    const WOOD_PRODUCTIVITY = 150 // куб. м. с га
    const WOOD_DENSITY = 1540 // кг на куб. м
    const COUNTY_COUNT = 48 // количество графств в Англии

    const WOOD_PRODUCTIVITY_KM_KG = WOOD_PRODUCTIVITY * WOOD_DENSITY * 100 //": 23100 тонн древесины с кв. км
    const IRON_PRODUCTION_PER_FURNACE = 4 * 100 * 356 // 4 крицы по 100 кг в день 
    const WOOD_CONSUMPTION_PER_FURNACE = IRON_PRODUCTION_PER_FURNACE * 50 // ": 7300 тонн 
    const DEFORESTATION_SPEED_PER_FURNACE = WOOD_CONSUMPTION_PER_FURNACE / WOOD_PRODUCTIVITY_KM_KG  // 0,316 кв. км в год - скорость потребления древесины на один горн в год

    let button: HTMLButtonElement
    let furnacesPerCountyInput: HTMLInputElement
    let furnacesPerCountyOutput: HTMLSpanElement
    let canvas: HTMLCanvasElement
    let conclusion: HTMLDivElement
    let conclusionSpan: HTMLSpanElement
    let kmPerPixel: HTMLParagraphElement

    function setFurnacesCount(){
      const {value} = furnacesPerCountyInput
      furnacesPerCountyOutput.textContent = value
    }

    async function delayedAction (delay: number = 100, func = () => {}){
        return new Promise((yep) => setTimeout(() => yep(func()), delay))
    }

    async function deforestation(){
        const ctx = (canvas.getContext('2d'))
        if(!ctx) throw 'no ctx'
        const greens = await resetImage()
        let browns = 0
        const {width, height} = canvas
        button.classList.add('disabled')
        let years = 0
        conclusionSpan.innerHTML = ''
        conclusion.classList.add('d-none')
        const furnacesCount = furnacesPerCountyInput.value
        const imageData = ctx.getImageData(0, 0, width, height)
        const {data} = imageData
        const PIXELS_COUNT = width * height
        const BYTE_COUNT  = PIXELS_COUNT * 4
        
        for(let i = BYTE_COUNT - 4; browns / greens < SQUARE_RATIO; i -= 4){
                const pixel = data.slice(i, i + 4)
            const [red, green, blue] = pixel
            if(!(red < green && blue  < green)) continue
            data[i] = 166
            data[i + 1] = 62
            data[i + 2] = 41
            browns++
            const speed = Math.round(DEFORESTATION_SPEED_PER_FURNACE * COUNTY_COUNT * +furnacesCount)
            if(browns % speed === 0){
                await delayedAction()
                ctx.putImageData(imageData, 0, 0)
                years++
            }
        }

        ctx.putImageData(imageData, 0, 0)
        conclusionSpan.innerHTML = `При наличии ${furnacesCount} горнов в каждом из 48 графств Англия могла лишится леса за ${years} ${getYearPostfix(years)}.`
        conclusion.classList.remove('d-none')
        setTimeout(() =>{
            conclusion.classList.add('d-none')
            button.classList.remove('disabled')
        }, 5000)
    }

    function getYearPostfix(years: number){
        let rest = years % 100
        if(rest > 10 && rest < 20) return 'лет'
        rest = years % 10
        switch(rest){
            case 1: return 'год'
            case 2:
            case 3:
            case 4:
            return 'года'
            default: return 'лет'
        }
    }

    const resetImage = () => new Promise<number>((yep, nop) => {
        const ctx = canvas.getContext('2d')
        if(!ctx) throw 'no ctx'
        const {width, height} = canvas
        const PIXELS_COUNT = width * height
        const BYTE_COUNT  = PIXELS_COUNT * 4
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0); 
            const imageData = ctx.getImageData(0, 0, width, height)
            const {data} = imageData
            let greens = 0
            for(let i = 0; i < BYTE_COUNT; i += 4){
                const pixel = data.slice(i, i + 4)
                const [red, green, blue] = pixel
                if(red < green && blue  < green) greens++
            }
            yep(greens)
        }
        img.src = `${gb}?${Math.random()}`;
    })

    onMount(async () => {
        await resetImage().catch(err => console.log(err))
    })

</script>

<section>
    <div class="alert alert-danger alert-dismissible fade show d-none" role="alert" bind:this={conclusion}>
        <span bind:this={conclusionSpan}></span>
    </div>
    <div id="inputs">
            <label for="furnaces-per-county" class="form-label">Горнов на графство: <strict bind:this={furnacesPerCountyOutput}>50</strict></label>
            <input type="range" class="form-range ms-3 me-5" id="furnaces-per-county" value="50" min="10" max="100" step="10" bind:this={furnacesPerCountyInput} onchange={setFurnacesCount}>
            <button class="btn btn-primary" bind:this={button} onclick={deforestation}>Смоделировать</button>
    </div>
    <div class="canvas-holder">
        <canvas bind:this={canvas} width="385" height="600"></canvas>
        <!-- svelte-ignore a11y_missing_attribute -->
        <!-- img src={gb} bind:this={image} class="d-none"/ -->
    </div>
    <p class="text-center" bind:this={kmPerPixel}>Квадратных километров на 1 пиксель: <strong id="km-per-pixel"></strong></p>
</section>

<style lang="scss">

    section {
        position: relative;
    }

    .alert {
        position: absolute;
        width: 50%;
    }

    #inputs label {
        margin: 0;
        white-space: nowrap;
    }   

    #inputs {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }    

    .canvas-holder {
        margin: 1rem auto;
        width: 100%;
        height: 600px;
        display: flex;
        justify-content: center;
    }
</style>
