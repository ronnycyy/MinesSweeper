function Mine(tr, td, mineNum) {
  this.tr = tr;   //行数
  this.td = td;   //列数
  this.mineNum = mineNum;  //雷的数量

  this.squares = [];   //方格对象数组，存放类型、值等字段
  this.tds = [];  //方格dom形成的数组
  this.surplusMine = mineNum;  //剩余雷数

  this.parent = document.querySelector('.gameBox');
}

// 生成n个不同的数字
Mine.prototype.randomNum = function () {
  var square = new Array(this.tr * this.td);
  for(var i = 0; i < square.length; i++) {
    square[i] = i;
  }

  // 数组乱序
  square.sort(function() {
    return 0.5 - Math.random()
  });

  return square.slice(0, this.mineNum);
}

// 初始化
Mine.prototype.init = function () {
  var rn = this.randomNum();  //雷在格子里的位置
  var n = 0;
  for(var i = 0; i < this.tr; i++) {
    this.squares[i] = [];
    for(var j = 0; j < this.td; j++) {
      if(rn.indexOf(n++) != -1) {
        this.squares[i][j] = {
          type: 'mine',
          x: j,    //x是这一行的第几个方格的意思
          y: i
        };
      }else {
        this.squares[i][j] = {
          type: 'number',
          x: j,
          y: i,
          value: 0
        };
      }

    }
  }

  this.parent.oncontextmenu = function() {
    return false;
  }
  this.updateNum();
  this.createDom();

  //处理剩余雷数
  this.mineNumDom = document.querySelector('.mineNum');
  this.surplusMine = this.mineNum;
  this.mineNumDom.innerHTML = this.surplusMine;

  //处理游戏提示
  document.querySelector(".tips").style.display = 'none';
}

// 创建表格
Mine.prototype.createDom = function () {
  var This = this;
  var table = document.createElement('table');
  
  for (var i = 0; i < this.tr; i++) {
    var domTr = document.createElement('tr');
    this.tds[i] = [];

    for (var j = 0; j < this.td; j++) {
      var domTd = document.createElement('td');

      domTd.pos = [i,j];
      domTd.onmousedown = function() {
        This.play(event, this);   //This指的是实例对象，this指的是点击的那个td
      };
      
      this.tds[i][j] = domTd;

      domTr.appendChild(domTd);
    }

    table.appendChild(domTr);
  }

  this.parent.innerHTML = '';  //清空上次的状态
  this.parent.appendChild(table);
}

// 找某个方格周围的8个方格
Mine.prototype.getAround = function(square) {
  var x = square.x;
  var y = square.y;
  var result = [];

  /**
   * x-1,y-1    x,y-1     x+1,y-1
   * x-1,y      x,y       x+1,y
   * x-1,y+1    x,y+1     x+1,y+1
   */
  for(var i = x-1; i <= x+1; i++) {
    for(var j = y-1; j <= y+1; j++) {
      if(
        i < 0 ||  //超左
        j < 0 ||  //超上
        i > this.td - 1 ||  //超右
        j > this.tr - 1 ||  //超下
        (i == x && j == y) ||     //它自己
        this.squares[j][i].type == 'mine'    //是个雷
      ) {
        continue;
      }

      result.push([j,i]);   //push数据：第j行，第i列有数字
    }
  }

  return result;
}

// 更新所有的数字
Mine.prototype.updateNum = function() {
  for(var i = 0; i < this.tr; i++) {
    for(var j = 0; j < this.td; j ++) {
      // 更新的只是雷周围的数字
      if(this.squares[i][j].type == 'number') {
        continue;
      }

      var num = this.getAround(this.squares[i][j]);   //获取到每一个雷周围的数字

      for(var k = 0; k < num.length; k++) {
        /**
         * num[i] == [0,1]
         * num[i][0] == 0
         * num[i][1] == 1
         */
        this.squares[num[k][0]][num[k][1]].value += 1;  //数字身边有个雷，就+1
      }
    }
  }
}

Mine.prototype.play = function(ev, obj) {
  var This = this;

  //点击左键(标注小红旗的方格不可点击左键)
  if(ev.which == 1 && obj.className != 'flag') {

    var curSquare = this.squares[obj.pos[0]][obj.pos[1]];
    var cl = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

    if(curSquare.type == 'number') {
      obj.innerHTML = curSquare.value;
      obj.className = cl[curSquare.value];

      //当点击到数字0时，显示一大片
      if(curSquare.value == 0) {
        obj.innerHTML = '';   //取消0的数字显示


        function getAllZero(square) {
          var around = This.getAround(square);  //获取周围方格

          //递归显示，直到周围不是0
          for(var i = 0; i < around.length; i++) {
            var x = around[i][0];
            var y = around[i][1];

            This.tds[x][y].className = cl[This.squares[x][y].value];  //给周围数字加上样式

            //如果周围还是0
            if(This.squares[x][y].value == 0) {

              //如果该dom对象没有找过
              if(!This.tds[x][y].check) {
                This.tds[x][y].check = true;
                getAllZero(This.squares[x][y]);  //递归调用获取周围所有的0
              }
            }else {
              //如果不是0，显示数字
              This.tds[x][y].innerHTML = This.squares[x][y].value;
            }
          }
        }

        getAllZero(curSquare);
        
      }
    }else {
      this.gameOver(obj);
    }
  }

  //用户点击的是右键
  if(ev.which == 3) {

    if(obj.className && obj.className != 'flag') return;

    obj.className = obj.className ? '' : 'flag';    //右击空白格可添加小红旗，再次右击可以取消

    //处理剩余雷数
    if(obj.className == 'flag') {
      this.mineNumDom.innerHTML = --this.surplusMine;
    } else {
      this.mineNumDom.innerHTML = ++this.surplusMine; 
    }

    //剩余雷数为0时，检查小红旗背后是否都是雷
    if(this.surplusMine == 0) {
      for(var i = 0; i < this.tr; i++) {
        for(var j = 0; j < this.td; j++) {
          if(this.tds[i][j].className == 'flag') {
            if(this.squares[i][j].type != 'mine') {
              this.gameOver();   
              return;
            }
          }
        }
      }

      alert("恭喜你，游戏通过！");
      this.init();
    }

  }
}

//游戏结束
Mine.prototype.gameOver = function(clickTd) {
  /**
   * 1、显示所有的雷
   * 2、取消所有的点击事件
   * 3、给点中的雷标红
   */

   for(var i = 0; i < this.tr; i++) {
     for(var j = 0; j < this.td; j++) {
       if(this.squares[i][j].type == 'mine') {
         this.tds[i][j].className = 'mine';
       }

       this.tds[i][j].onmousedown = null;
     }
   }

   if(clickTd) {
     clickTd.className = 'redMine';
   }

   var tips = document.querySelector(".tips");
   tips.style.display = 'block';
}

//按钮功能
var btns = document.querySelectorAll(".level button");
var mine = null;
var li = 0;  //上次的索引
var levelArr = [[9, 9, 10], [16, 16, 40], [28, 28, 99]];  //难度设置

for(let i = 0; i < btns.length - 1; i++) {
  btns[i].onclick = function() {
    btns[li].className = '';  //清除上次点击的样式
    this.className = 'active';

    mine = new Mine(...levelArr[i]);
    mine.init();

    li = i; //更新状态
  }
}

btns[0].onclick();   //初始化
btns[3].onclick = function() {
  mine.init();
}
