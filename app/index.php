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
    <title>The Economy Sim</title>
    <link rel="stylesheet" href="/game.css">
    <script type="module" src="/Scripts/terminal.js" defer></script>
    <script type="module" src="/Scripts/game.js"></script>
    <script type="module" src="/Scripts/economy.js"></script>
    <script type="module" src="/Scripts/buildings.js"></script>
</head>
<body>
    <header id="head">
        <?php if(false): ?>
        <select name="theme" id="theme">
            <option value="light"<?php if ($theme == 'light') echo ' selected'; ?>>Light</option>
            <option value="dark"<?php if ($theme == 'dark') echo ' selected'; ?>>Dark</option>
        </select>
        <?php endif; ?>
        <div id="stats">
            <span id="raw"></span>

            <span id="processed"></span>

            <span id="food"></span>

            <span id="money"></span>
            <span id="population"></span>

            <span id="priceTag"></span>
        </div>

        <span id="time">Time: <span id="time-value">0</span></span>

        <div class="buttons">
            <button id="eco-term">Economy Terminal</button>
            <script type="module" src="./Scripts/saveLoad.js"></script>
            <button id="save/load">Save/Load</button>
        </div>
    </header>
    <main>
        <canvas id="fg" width="800" height="600"></canvas>
        <div class="terminal-container" id="economy-terminal">
            <div class="terminal-header">
                <div class="buttons">
                    <span class="btn close" id="close-terminal"></span>
                    <span class="btn minimize"></span>
                    <span class="btn maximize"></span>
                </div>
                <div class="title">Economy Terminal</div>
            </div>

            <div class="terminal-body">
                <div id="output"></div>
            </div>

            <div class="input-line">
                <span class="prompt">></span>
                <input type="text" id="command-input" autofocus autocomplete="off" spellcheck="false">
            </div>
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