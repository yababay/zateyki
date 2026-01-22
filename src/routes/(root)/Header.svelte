<script lang="ts">

    import banner from './pretty-barn.png'
    export let title

</script>

<header>
    <img src={banner} alt={title}>
    <h1>{title}</h1>
    <ul>
        <li>
            <a href="https://t.me/babaykina_sarayka" title="Телеграм-канал"><i class="bi bi-telegram"></i>&nbsp;Телеграм-канал</a>
        </li>
    </ul>
</header>

<style lang="scss">

header {
    margin: 0;
    border: 0;
    padding: 0;
    background-color: #cdd6c7;;
    width: 100%;
    height: 20vh;
    min-height: 200px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
}

ul {
    //width: 20%;
    list-style: none; /* Убираем маркеры списка */
    padding: 0;       /* Убираем стандартный отступ */
    margin: 0;        /* Убираем стандартный отступ */
    display: flex;    /* Делаем элементы гибкими и выстраиваем их в ряд */
    /* Стили для элементов списка */
}

li {
    margin-right: 2rem; /* Добавляем отступ между элементами */
}

/* Стили для ссылок (необязательно, но полезно для меню) */
a {
    font-size: 1.5rem;
    text-decoration: none; /* Убираем подчеркивание ссылок */
    color: #a0b89f;
}    

a:hover {
    color: #4f6a4e;
}

h1 {
    margin-left: 3rem;
    font-size: 3rem;
    color: #4f6a4e;
}

img {
    height: 75%;
    margin-left: 2rem;
}

</style>