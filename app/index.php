<?php
if(isset($_POST['theme'])){
        $theme = $_POST['theme'];
        setcookie('theme', $theme, time()+3600*24*30);
    }else{
        $theme = $_COOKIE['theme'] ?? 'light';
    }
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodingGod</title>
    <link rel="stylesheet" href="/game.css">
</head>
<script type="module" src="/Scripts/game.js"></script>
<script type="module" src="/Scripts/economy.js"></script>
<script type="module" src="/Scripts/buildings.js"></script>
<body>
    <header id="head">
        <select name="theme" id="theme">
            <option value="light"<?php if ($theme == 'light') echo ' selected'; ?>>Light</option>
            <option value="dark"<?php if ($theme == 'dark') echo ' selected'; ?>>Dark</option>
        </select>
        <span class="popup" id="raw"></span>
        <span class="popup_window" id="rawdet">

        </span>
        <span class="popup" id="processed"></span>
        <span class="popup_window" id="procdet">

        </span>
        <span class="popup" id="money"></span>
        <span class="popup_window" id="incomes">

        </span>
        <span id="food"></span>
        <span id="priceTag"></span>
        <span id="population"></span>
        <button id="productionTerminal">Production Terminal</button>
        <script type="module" src="./Scripts/saveLoad.js"></script>
        <button id="save/load">Save/Load</button>
    </header>
    <main>
        <canvas id="fg" width="800" height="600"></canvas>
        <div class="modal">
            <div class="mheader"><h3></h3></div>
            <div class="mcontent"><p id="content"></p></div>
            <div class="mcontent"><p id="buildcontent">
                <button class="build" value="house">House</button><br>
                <button class="build" value="foundry">Foundry</button><br>
                <button class="build" value="shop">Shop</button><br>
                <button class="build" value="farm">Farm</button><br>
                <button class="build" value="mines">Mines</button><br>
                <button class="build" value="path">Path</button><br>
                <button class="build" value="mason">Mason</button>
            </p></div>
            <div class="mfooter"><button id="mclose"></button></div>
        </div>
        <canvas id="pbg" width="800" height="600"></canvas>
        <canvas id="bg" width="800" height="600"></canvas>
    </main>
    <img class="build-img" src="/imgs/foundry.jpg" alt="" id="foundry">
    <img class="build-img" src="/imgs/farm.jpg" alt="" id="farm">
    <img class="build-img" src="/imgs/house.jpg" alt="" id="house">
    <img class="build-img" src="/imgs/store.jpg" alt="" id="shop">
    <img class="build-img" src="/imgs/mine.jpg" alt="" id="mines">
    <img class="build-img" src="/imgs/mason.jpg" alt="" id="mason">
    <img class="build-img" src="/imgs/path.png" alt="" id="path">
</body>
</html>