'use strict';

/* GLOBAL VARIABLES */
  let e_Canvas = document.getElementById('canvas');
  let canvasContext = e_Canvas.getContext('2d');

  //values assigned in fInterfaceAndGlobalVariablesSetup()
  let n_BlockSize;
  let n_CanvasWidth; 
  let n_CanvasHeight;
  let n_WidthInBlocks; // 0,0 - top-left cell
  let n_HeightInBlocks; //n_WidthInBlocks-1, n_HeightInBlocks-1 - bottom-right cell
  let n_updateFrequancyMs;
  let n_SpeedMode;
  //values assigned in fInterfaceAndGlobalVariablesSetup()

  let s_GameState = 'active'; // active, paused or over
  let n_Score = 0;
  let n_TimeoutId; //for game loop
  let n_IntervalId; //for repeating action while keypress 

  //object for return direction name on keycode request
  let o_Directions = {
    37: 'left', //←
    65: 'left', //A
    38: 'up', //↑
    87: 'up', //W
    39: 'right', // →
    68: 'right', //D
    40: 'down', //↓
    83: 'down' //S
  }
  //object for return action name on keycode request
  let o_UsedKeys = {
    80: 'pause', //P
    73: 'info', //I
    78: 'speed-', //N
    77: 'speed+', //M
    13: 'closeWindow', //Enter
    27: 'closeWindow' //Esc
  }

/* GLOBAL VARIABLES end */

/* FUNCTIONS */

  /*setup intrface. Used for dynamic setting sizes of elements.
  min-width 500px, min-height 500px. if client size fewer - scrollbars
  if bigger - content size expands to client size*/
  let  fInterfaceAndGlobalVariablesSetup = () => {
    let nWindowWidth = document.documentElement.clientWidth;
    let nWindowHeight = document.documentElement.clientHeight;
    let nWindowShortSide = Math.min(nWindowWidth,nWindowHeight);
    let nBodyMinWidth;
    let nBodyMinHeight;
    let nBodyMinSide;

  //setting nBodyMin's variables
    if (nWindowWidth < 500){
      nBodyMinWidth = 500;
    } else {
      nBodyMinWidth = nWindowWidth - 20; //20 - indents in px
    }
    if (nWindowHeight < 500){
      nBodyMinHeight = 500;
    } else {
      nBodyMinHeight = nWindowHeight - 20; //20 - indents in px
    }
    //if mobile device and landscape orientation - height shrinks
    //to avoid getting out of sight the game interface due to a browser interface
    if (fIsMobile() && nWindowWidth > nWindowHeight){
      nBodyMinHeight = nBodyMinHeight * 0.85;
    }
    nBodyMinSide = Math.min(nBodyMinWidth,nBodyMinHeight);
  //setting nBodyMin's variables End

  //setting css sizes to body and #main-container
    $('body').css({
      'min-width' : nBodyMinWidth + 'px',
      'min-height' : nBodyMinHeight + 'px'
    });
    $('#main-container').css({
      'width' : nBodyMinWidth + 'px',
      'height' : nBodyMinHeight + 'px'
    });
  //setting css sizes to body and #main-container End

  //especially settings design for PC or mobile version
    if (!fIsMobile()) {
      //desctop settings
      //speed for PC (faster than in mobile)
      n_updateFrequancyMs = 85;
      n_SpeedMode = 20 - n_updateFrequancyMs / 5;
    } else {
      //mobile settings
      //common
      //speed for mobile (slower than in PC)
      n_updateFrequancyMs = 135;
      n_SpeedMode = 30 - n_updateFrequancyMs / 5;
      //Increases text size on mobile devices
      (nWindowWidth < nWindowHeight)
        ? $('body').css('font-size','2em')
        : $('body').css('font-size','1.5em');
      $('#pc-controls-help').css('display','none');
      $('#mobile-control-container').css('display','flex');
      //common + portrait orientation
      //info window size adjustments
      $('.info-window').css('height',nWindowHeight / 6);
      $('.info-window').css('width', nWindowWidth / 2);
      $('.close-btn').css('height', '40px');
      $('.close-btn').css('width', '40px');
      let nControlContainerHeight = nWindowShortSide * 0.5;
      let nButtonSize = (nControlContainerHeight - 20) / 3 ;
      $('#mobile-control-container').css({
        'width' : nBodyMinWidth + 'px',
        'height' : nControlContainerHeight + 'px'
      });
      //landscape orientation
      if (nWindowWidth > nWindowHeight){
        //for spzce economy
        $('.header').css('display','none');
        $('#info-bar').css('border-radius','20px 20px 0px 0px');
        //info window size adjustments for landscape orientation
        $('.info-window').css('height',nWindowHeight / 2.5);
        $('.info-window').css('width', nWindowWidth / 2.5);
        $('.close-btn').css('height', '30px');
        $('.close-btn').css('width', '30px');
        //move controlls
        $("#controls-speed-container").appendTo("#landscape-placeholder-speed");
        $("#controls-direction-container").appendTo("#landscape-placeholder-direction");
        $('#controls-speed-container').css('border','none');
        $('#mobile-control-container').remove();
        nButtonSize = nWindowHeight / 5;
      }

      //common
      //change control buttons size
      $('.mobile-control-button').css({
        'width': nButtonSize +'px',
        'height': nButtonSize +'px',
        'margin': '10px'
      });
    } //mobile end

  //especially settings design for PC or mobile version End

  //continuation of the general design settings
    if (localStorage['lsSnakeRecord'] === undefined){
      localStorage['lsSnakeRecord'] = '0';
    }
    $('#s_record').text(localStorage['lsSnakeRecord']);
    $('#s_speed').text(n_SpeedMode);

    //nBodyMinSide / 20, rounded to 5 - universal size for cells (20 sells in minSide) 
    n_BlockSize = Math.floor( (nBodyMinSide / 20) / 5) * 5;
    n_CanvasWidth = Math.floor( $('#canvas-container').width() / n_BlockSize) * n_BlockSize;
    n_CanvasHeight = Math.floor( $('#canvas-container').height() / n_BlockSize) * n_BlockSize;

    //css canvas width and height will be equal to html canvas width and height 
    e_Canvas.width = n_CanvasWidth;
    e_Canvas.height = n_CanvasHeight;

    //for mobile (workaround to expand height of portrait orientation of mobile)
    n_CanvasHeight = Math.floor( $('#canvas-container').height() / n_BlockSize) * n_BlockSize;
    e_Canvas.height = n_CanvasHeight;
    //for mobile (workaround to expand height of portrait orientation of mobile)

    //landscape orientation especially width canvas settings
    if (fIsMobile() && nWindowWidth > nWindowHeight){
      n_CanvasWidth = n_CanvasWidth - $('#landscape-placeholder-direction').width()
        - $('#landscape-placeholder-speed').width();
      n_CanvasWidth = Math.floor( n_CanvasWidth / n_BlockSize) * n_BlockSize;
      e_Canvas.width = n_CanvasWidth;
    }

    n_WidthInBlocks = Math.floor(n_CanvasWidth / n_BlockSize);
    n_HeightInBlocks = Math.floor(n_CanvasHeight / n_BlockSize);
  }

  //check is it device mobile (with touchscreen). True - mobile/ false - desctop
  let fIsMobile = () => {
    return ('ontouchstart' in document.documentElement);
  }

  //draw grid, for debugging
  let fDrawGrid = () => {
    canvasContext.strokeStyle = "silver";
    canvasContext.lineWidth = 1;
    canvasContext.beginPath();
    //horizontal  lines
    for (var i = n_HeightInBlocks - 1; i >= 0; i--) {
      canvasContext.moveTo(0, i * n_BlockSize);
      canvasContext.lineTo(n_CanvasWidth,i * n_BlockSize); 
    }
    //vertical lines
    for (var i = n_WidthInBlocks - 1; i >= 0; i--) {
      canvasContext.moveTo(i * n_BlockSize, 0);
      canvasContext.lineTo(i * n_BlockSize, n_CanvasHeight); 
    }
    canvasContext.stroke();
  }

  //Game stops
  let fGameOver = () => {
    $('#over-score').text('Score: ' + n_Score);
    //record check
    if (+localStorage['lsSnakeRecord'] > n_Score){
      $('#to-record').text(+localStorage['lsSnakeRecord'] - n_Score + ' points till record');
    } else if (+localStorage['lsSnakeRecord'] === n_Score) {
      $('#to-record').text('Wow, almost record!');
    } else if (+localStorage['lsSnakeRecord'] < n_Score) {
      localStorage['lsSnakeRecord'] = n_Score;
      $('#to-record').text('New record! ' + n_Score + ', Well done!');
      $('#over-score').css('display','none');
    } 
    hGameoverWindowOpen();
  }

  //main loop for game, where occur redrawing on canvas every n_updateFrequancyMs
  let fGameLoop = () => {
    canvasContext.clearRect(0,0,n_CanvasWidth,n_CanvasHeight);
    //fDrawGrid(); //for debug
    o_Apple.draw();
    o_Snake.move();
    o_Snake.draw();
    if (s_GameState === 'over'){
      return;
    }
    n_TimeoutId = setTimeout(fGameLoop, n_updateFrequancyMs);
  }

  let fGamePause = () => {
    clearTimeout(n_TimeoutId);
    s_GameState = 'paused';
  }

  let fGameStop = () => {
    clearTimeout(n_TimeoutId);
    s_GameState = 'over';
  }

  let fGameContinue = () => {
    fGameLoop();
    s_GameState = 'active';
  }

  //hide info-window and resume game, or reload game if it's over
  let fCloseAllWindows = () => {
    if (s_GameState === 'paused'){
      $('#controls-window').css('display','none');
      $('#pause-window').css('display','none');
      $('#gameover-window').css('display','none');
      s_GameState = 'active';
      fGameContinue();
    } else if (s_GameState === 'over'){
      location.reload(false);
    }   
  }

  //auxilary function for drawing
  let fDrawCircle = (Xcenter, Ycenter, radius, fill = true, style = 'black') => {
    canvasContext.fillStyle = style;
    canvasContext.beginPath();
    canvasContext.arc(Xcenter, Ycenter, radius, 0, Math.PI * 2);
    (fill) ? canvasContext.fill() : canvasContext.stroke();
  }
  
/* FUNCTIONS end */

/* CONSTRUCTORS */

  //game block constructor. Block - main object. Can be empty, Apple or Snake part
  let Block = function(col, row) {
    this.col = col;
    this.row = row;
  }

  let Snake = function() {
    this.segments = [
      new Block(Math.floor(n_WidthInBlocks / 2) + 1, Math.floor(n_HeightInBlocks / 2)),
      new Block(Math.floor(n_WidthInBlocks / 2), Math.floor(n_HeightInBlocks / 2)),
      new Block(Math.floor(n_WidthInBlocks / 2) - 1, Math.floor(n_HeightInBlocks / 2))
    ];
    this.direction = 'right';
    this.nextDirection = 'right';
  }

  let Apple = function() {
    this.move();
  }

/* CONSTRUCTORS end */

/* PROTOTYPE METHODS */

  Block.prototype.drawSnakePart = function(color = 'black') {
    let x = this.col * n_BlockSize;
    let y = this.row * n_BlockSize;
    canvasContext.fillStyle = color;
    canvasContext.fillRect(x, y, n_BlockSize, n_BlockSize);
  }

  Block.prototype.drawSnakeHead = function(color = 'black') {
    canvasContext.fillStyle = color;
    let TopLeftX = this.col * n_BlockSize;
    let TopLeftY = this.row * n_BlockSize;
    let radius = n_BlockSize / 2;
    let Xcenter = this.col * n_BlockSize + radius;
    let Ycenter = this.row * n_BlockSize + radius;

    fDrawCircle(Xcenter, Ycenter, radius); //black circle

    //suitable half square + suitable eyes (red if game over)
    switch (o_Snake.direction) {
      case 'up':
        canvasContext.fillRect(TopLeftX, TopLeftY + radius, n_BlockSize, radius);
        if (s_GameState !== 'over'){
          fDrawCircle(Xcenter + n_BlockSize / 6, Ycenter - n_BlockSize / 10, radius / 6, true, 'white');
          fDrawCircle(Xcenter - n_BlockSize / 6, Ycenter - n_BlockSize / 10, radius / 6, true, 'white');
        } else {
          fDrawCircle(Xcenter + n_BlockSize / 6, Ycenter - n_BlockSize / 10, radius / 6, true, 'red');
          fDrawCircle(Xcenter - n_BlockSize / 6, Ycenter - n_BlockSize / 10, radius / 6, true, 'red');
        }
        break;
      case 'right':
        canvasContext.fillRect(TopLeftX, TopLeftY, radius, n_BlockSize);
        if (s_GameState !== 'over'){
          fDrawCircle(Xcenter + n_BlockSize / 10, Ycenter - n_BlockSize / 6, radius / 6, true, 'white');
          fDrawCircle(Xcenter + n_BlockSize / 10, Ycenter + n_BlockSize / 6, radius / 6, true, 'white');
        } else {
          fDrawCircle(Xcenter + n_BlockSize / 10, Ycenter - n_BlockSize / 6, radius / 6, true, 'red');
          fDrawCircle(Xcenter + n_BlockSize / 10, Ycenter + n_BlockSize / 6, radius / 6, true, 'red');
        }
        break;
      case 'down':
        canvasContext.fillRect(TopLeftX, TopLeftY, n_BlockSize, radius);
        if (s_GameState !== 'over'){
          fDrawCircle(Xcenter + n_BlockSize / 6, Ycenter + n_BlockSize / 10, radius / 6, true, 'white');
          fDrawCircle(Xcenter - n_BlockSize / 6, Ycenter + n_BlockSize / 10, radius / 6, true, 'white');
        } else {
          fDrawCircle(Xcenter + n_BlockSize / 6, Ycenter + n_BlockSize / 10, radius / 6, true, 'red');
          fDrawCircle(Xcenter - n_BlockSize / 6, Ycenter + n_BlockSize / 10, radius / 6, true, 'red');
        }
        break;
      case 'left':
        canvasContext.fillRect(TopLeftX + radius, TopLeftY, radius, n_BlockSize);
        if (s_GameState !== 'over'){
          fDrawCircle(Xcenter - n_BlockSize / 10, Ycenter - n_BlockSize / 6, radius / 6, true, 'white');
          fDrawCircle(Xcenter - n_BlockSize / 10, Ycenter + n_BlockSize / 6, radius / 6, true, 'white');
        } else {
          fDrawCircle(Xcenter - n_BlockSize / 10, Ycenter - n_BlockSize / 6, radius / 6, true, 'red');
          fDrawCircle(Xcenter - n_BlockSize / 10, Ycenter + n_BlockSize / 6, radius / 6, true, 'red');
        }
        break;
    }
  }

  Block.prototype.drawApple = function() {
    let radius = n_BlockSize / 2;
    let Xcenter = (this.col * n_BlockSize) + radius;
    let Ycenter = (this.row * n_BlockSize) + radius;
    canvasContext.fillStyle = 'tomato';
    canvasContext.strokeStyle = 'black';
    canvasContext.lineWidth = 2;
    
    fDrawCircle(Xcenter, Ycenter, radius, true, 'tomato');
    fDrawCircle(Xcenter, Ycenter, radius-1, false);
  }

  //check equality positions of 2 blocks
  Block.prototype.equal = function(otherBlock) {
    return this.col === otherBlock.col && this.row === otherBlock.row;
  }

  //draw square for each part of snake
  Snake.prototype.draw = function(direction) {
    //head
    this.segments[0].drawSnakeHead();
    //body
    for (let i = 1; i < this.segments.length; i++){
      this.segments[i].drawSnakePart('green');
    }
  }

  //Create new head and add it to start of snake, to move it on the direction
  Snake.prototype.move = function() {
    let o_Head = this.segments[0];
    let o_NewHead;
    this.direction = this.nextDirection;
    if (this.direction === 'right'){
      o_NewHead = new Block(o_Head.col + 1, o_Head.row);
    } else if (this.direction === 'left'){
      o_NewHead = new Block(o_Head.col - 1, o_Head.row);
    } else if (this.direction === 'up'){
      o_NewHead = new Block(o_Head.col, o_Head.row - 1);
    } else if (this.direction === 'down'){
      o_NewHead = new Block(o_Head.col, o_Head.row + 1);
    }
    if (this.fCheckCollision(o_NewHead) ){
      fGameOver();
      return;
    }
    this.segments.unshift(o_NewHead);
    //apple found
    if (o_NewHead.equal(o_Apple.position) ){
      $('#s_score').text(++n_Score);
      if (+localStorage['lsSnakeRecord'] < n_Score){
        $('#s_record').text(n_Score + ' new!');
      }
      o_Apple.move();
    } else { //just move
      this.segments.pop();
    }
  }

  //check collision of snake head with own body or wall
  Snake.prototype.fCheckCollision = function(headBlock){
    //check wall collision
    let b_TopCollision = (headBlock.row === -1);
    let b_RightCollision = (headBlock.col === n_WidthInBlocks);
    let b_BottomCollision = (headBlock.row === n_HeightInBlocks);
    let b_LeftCollision = (headBlock.col === -1);
    let b_WallCollision = b_TopCollision || b_RightCollision ||
      b_BottomCollision || b_LeftCollision;
    //check self collision
    let b_SelfColission = false;
    for (let i = 0; i < this.segments.length; i++){
      if (headBlock.equal(this.segments[i]) ){
        b_SelfColission = true;
        break;
      }
    }
    return b_WallCollision || b_SelfColission;
  }

  //Setting next direction, based on pressed key. Forbid opposite movement
  Snake.prototype.setDirection = function(s_NewDirection){
    if (this.direction === 'up' && s_NewDirection === 'down'){
      return;
    } else if (this.direction === 'right' && s_NewDirection === 'left'){
      return;
    } else if (this.direction === 'down' && s_NewDirection === 'up'){
      return;
    } else if (this.direction === 'left' && s_NewDirection === 'right'){
      return;
    }
    this.nextDirection = s_NewDirection;
  }

  Apple.prototype.draw = function(){
    this.position.drawApple();
  }

  //Move apple in random position except snake
  Apple.prototype.move = function(){
    let randomCol;
    let randomRow;
    let bSnakePosition;
    do { //set random position for apple while it no on snake part 
      bSnakePosition = false;
      randomCol = Math.floor(Math.random() * (n_WidthInBlocks));
      randomRow = Math.floor(Math.random() * (n_HeightInBlocks));
      this.position = new Block(randomCol, randomRow);
      for (var i = o_Snake.segments.length - 1; i >= 0; i--) { //check snake position
        if (this.position.equal(o_Snake.segments[i]) ){
          bSnakePosition = true; //new apple position is on snake
        }
      }
    } while (bSnakePosition);
  }

/* PROTOTYPE METHODS */

/* EVENT HANDLERS */

  //press on 'I' button (code 73) or button in header
  //displays #controls-window or close it
  let hShowHideControllsInfo = () => {
    if (s_GameState === 'active'){
      fGamePause();
      $('#controls-window').css('display','flex');
      return;
    } else if (s_GameState === 'over'){
      $('#constols_state').text('Game over');
      $('#gameover-window').css('display','none');
      $('#controls-window').css('display','flex');
    } else if (s_GameState === 'paused'){
      if ($('#pause-window').css('display') === 'flex'){ //paused with P
        $('#pause-window').css('display','none')
        $('#controls-window').css('display','flex');
        return;
      } else {
        $('#controls-window').css('display','none');
        fGameContinue();
      }
    }
  }

  //stops game and displays #gameover-window
  let hGameoverWindowOpen = () => {
    fGameStop();
    $('#gameover-window').css('display','flex');
  }

  let hHandleUsedKeys = (action) => {
    switch (action){
      case 'pause':
        hPauseUnpause();
        break;
      case 'info':
        hShowHideControllsInfo();
        break;
      case 'speed-':
        hSpeedDecrease();
        break;
      case 'speed+':
        hSpeedIncrease();
        break;
      case 'closeWindow':
        fCloseAllWindows();
        break;
    }
  }

  //press on 'P' button (code 80) - pause and unpause game
  let hPauseUnpause = () => {
    if (s_GameState === 'over'){
      return;
    }
    if ($('#controls-window').css('display') === 'flex'){
      $('#controls-window').css('display','none');
      fGameContinue();
      return;
    }
    if (s_GameState === 'active'){
      fGamePause();
      $('#pause-window').css('display','flex');
    } else{
      fGameContinue();
      $('#pause-window').css('display','none');
    } 
  }

  //press on N (78) or mobile button "-" - decrease speed
  let hSpeedDecrease = () => {
    if (fIsMobile()){ //mobile speed
      if (n_updateFrequancyMs < 145){
        n_updateFrequancyMs += 5;
        n_SpeedMode = 30 - n_updateFrequancyMs / 5;
      }
    } else { //desctop speed
      if (n_updateFrequancyMs < 95){
        n_updateFrequancyMs += 5;
        n_SpeedMode = 20 - n_updateFrequancyMs / 5;
      }
    }
    if (n_SpeedMode === 1){
      $('#s_speed').text(n_SpeedMode + ' (min)');
    } else{
      $('#s_speed').text(n_SpeedMode);
    }
  }

  //press on M (77) or mobile button "+" - increase speed
  let hSpeedIncrease = () => {
    if (fIsMobile()){ //moile speed
      if (n_updateFrequancyMs > 100){
        n_updateFrequancyMs -= 5;
        n_SpeedMode = 30 - n_updateFrequancyMs / 5;
      }
    } else { //desctop speed
      if (n_updateFrequancyMs > 50){
        n_updateFrequancyMs -= 5;
        n_SpeedMode = 20 - n_updateFrequancyMs / 5;
      }
    }
    if (n_SpeedMode === 10){
      $('#s_speed').text(n_SpeedMode + ' (max)');
    } else{
      $('#s_speed').text(n_SpeedMode);
    }
  }

/* EVENT HANDLERS end */

/* EVENTS */

  //PC events

  //buttons ok, resume and × in additional windows 
  $('.window-button').click(fCloseAllWindows);
  //click on ? in header of desctop vesion. Same as press I
  $('#pc-controls-help').click(hShowHideControllsInfo);

  //Common event for keydown
  $("body").keydown((e)=>{
    //after game over you can only restart game or open info about PC controls
    if (s_GameState === 'over'){
      if (e.keyCode === 27 || e.keyCode === 13){
        fCloseAllWindows();
      } else if (e.keyCode === 73){
        hShowHideControllsInfo();
        return;
      }
      return;
    }
    //set direction 
    let s_NewDirection = o_Directions[e.keyCode];
    if (s_NewDirection !== undefined) {
      o_Snake.setDirection(s_NewDirection);
    }
    //set another actions
    let s_Action = o_UsedKeys[e.keyCode];
    hHandleUsedKeys(s_Action);
  });

  //Mobile events
  //handles taps at mobile control buttons (and their childs) 
  $('.mobile-control-button').on('touchstart',(event)=>{
    //forbid to fire handler if any contol button still in use
    if (event.touches.length > 1) {
      return;
    }
    
    let a_ButtonsIds = ['button-speed_up', 'button-speed_down',
      'button-up', 'button-left', 'button-down', 'button-right'];
    let a_ButtonsActions = ['speed+', 'speed-', 'up', 'left',
      'down', 'right'];
    for (var i = a_ButtonsIds.length - 1; i >= 0; i--) {
      if (event.currentTarget.id ===  a_ButtonsIds[i]){
        //speed
        if (i < 2){
          hHandleUsedKeys(a_ButtonsActions[i]);
        } else { //direction
          o_Snake.setDirection(a_ButtonsActions[i]);
        }
        break;          
      }
    }
  });

/* EVENTS end */

/* MAIN CODE */
  fInterfaceAndGlobalVariablesSetup();
  let o_Snake = new Snake();
  let o_Apple = new Apple();
  fGameLoop();
/* MAIN CODE end */