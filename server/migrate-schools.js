require('dotenv').config()
const mysql = require('mysql2/promise')

const SCHOOLS = [
  // 985 (15)
  ['北京大学','https://www.pku.edu.cn','985','北京',1],
  ['清华大学','https://www.tsinghua.edu.cn','985','北京',2],
  ['复旦大学','https://www.fudan.edu.cn','985','上海',3],
  ['上海交通大学','https://www.sjtu.edu.cn','985','上海',4],
  ['浙江大学','https://www.zju.edu.cn','985','浙江',5],
  ['南京大学','https://www.nju.edu.cn','985','江苏',6],
  ['中山大学','https://www.sysu.edu.cn','985','广东',7],
  ['中国人民大学','https://www.ruc.edu.cn','985','北京',8],
  ['中国科学技术大学','https://www.ustc.edu.cn','985','安徽',9],
  ['华中科技大学','https://www.hust.edu.cn','985','湖北',10],
  ['武汉大学','https://www.whu.edu.cn','985','湖北',11],
  ['西安交通大学','https://www.xjtu.edu.cn','985','陕西',12],
  ['南开大学','https://www.nankai.edu.cn','985','天津',13],
  ['同济大学','https://www.tongji.edu.cn','985','上海',14],
  ['哈尔滨工业大学','https://www.hit.edu.cn','985','黑龙江',15],
  // 211 (29)
  ['北京科技大学','https://www.ustb.edu.cn','211','北京',21],
  ['北京邮电大学','https://www.bupt.edu.cn','211','北京',22],
  ['北京交通大学','https://www.bjtu.edu.cn','211','北京',23],
  ['南京航空航天大学','https://www.nuaa.edu.cn','211','江苏',24],
  ['南京理工大学','https://www.njust.edu.cn','211','江苏',25],
  ['苏州大学','https://www.suda.edu.cn','211','江苏',26],
  ['华东理工大学','https://www.ecust.edu.cn','211','上海',27],
  ['上海大学','https://www.shu.edu.cn','211','上海',28],
  ['武汉理工大学','https://www.whut.edu.cn','211','湖北',29],
  ['华中师范大学','https://www.ccnu.edu.cn','211','湖北',30],
  ['西安电子科技大学','https://www.xidian.edu.cn','211','陕西',31],
  ['长安大学','https://www.chd.edu.cn','211','陕西',32],
  ['西南交通大学','https://www.swjtu.edu.cn','211','四川',33],
  ['四川农业大学','https://www.sicau.edu.cn','211','四川',34],
  ['湖南师范大学','https://www.hunnu.edu.cn','211','湖南',35],
  ['南昌大学','https://www.ncu.edu.cn','211','江西',36],
  ['福州大学','https://www.fzu.edu.cn','211','福建',37],
  ['安徽大学','https://www.ahu.edu.cn','211','安徽',38],
  ['郑州大学','https://www.zzu.edu.cn','211','河南',39],
  ['河北工业大学','https://www.hebut.edu.cn','211','天津',40],
  ['太原理工大学','https://www.tyut.edu.cn','211','山西',41],
  ['云南大学','https://www.ynu.edu.cn','211','云南',42],
  ['广西大学','https://www.gxu.edu.cn','211','广西',43],
  ['海南大学','https://www.hainanu.edu.cn','211','海南',44],
  // 双一流 (10)
  ['南方科技大学','https://www.sustech.edu.cn','双一流','广东',51],
  ['上海科技大学','https://www.shanghaitech.edu.cn','双一流','上海',52],
  ['南京邮电大学','https://www.njupt.edu.cn','双一流','江苏',53],
  ['南京信息工程大学','https://www.nuist.edu.cn','双一流','江苏',54],
  ['南京林业大学','https://www.njfu.edu.cn','双一流','江苏',55],
  ['山西大学','https://www.sxu.edu.cn','双一流','山西',56],
  ['湘潭大学','https://www.xtu.edu.cn','双一流','湖南',57],
  ['华南农业大学','https://www.scau.edu.cn','双一流','广东',58],
  ['广州医科大学','https://www.gzhmu.edu.cn','双一流','广东',59],
  ['上海中医药大学','https://www.shutcm.edu.cn','双一流','上海',60],
  // 普通本科 (116)
  ['浙江工业大学','https://www.zjut.edu.cn','普通本科','浙江',101],
  ['杭州电子科技大学','https://www.hdu.edu.cn','普通本科','浙江',102],
  ['浙江理工大学','https://www.zstu.edu.cn','普通本科','浙江',103],
  ['浙江师范大学','https://www.zjnu.edu.cn','普通本科','浙江',104],
  ['杭州师范大学','https://www.hznu.edu.cn','普通本科','浙江',105],
  ['温州大学','https://www.wzu.edu.cn','普通本科','浙江',106],
  ['绍兴文理学院','https://www.usx.edu.cn','普通本科','浙江',107],
  ['嘉兴大学','https://www.zjxu.edu.cn','普通本科','浙江',108],
  ['上海师范大学','https://www.shnu.edu.cn','普通本科','上海',109],
  ['上海理工大学','https://www.usst.edu.cn','普通本科','上海',110],
  ['上海海事大学','https://www.shmtu.edu.cn','普通本科','上海',111],
  ['上海海洋大学','https://www.shou.edu.cn','普通本科','上海',112],
  ['上海工程技术大学','https://www.sues.edu.cn','普通本科','上海',113],
  ['深圳大学','https://www.szu.edu.cn','普通本科','广东',114],
  ['广州大学','https://www.gzhu.edu.cn','普通本科','广东',115],
  ['广东工业大学','https://www.gdut.edu.cn','普通本科','广东',116],
  ['广东外语外贸大学','https://www.gdufs.edu.cn','普通本科','广东',117],
  ['南京工业大学','https://www.njtech.edu.cn','普通本科','江苏',118],
  ['南京财经大学','https://www.nufe.edu.cn','普通本科','江苏',119],
  ['江苏大学','https://www.ujs.edu.cn','普通本科','江苏',120],
  ['扬州大学','https://www.yzu.edu.cn','普通本科','江苏',121],
  ['南通大学','https://www.ntu.edu.cn','普通本科','江苏',122],
  ['武汉科技大学','https://www.wust.edu.cn','普通本科','湖北',123],
  ['湖北大学','https://www.hubu.edu.cn','普通本科','湖北',124],
  ['中南民族大学','https://www.scuec.edu.cn','普通本科','湖北',125],
  ['三峡大学','https://www.ctgu.edu.cn','普通本科','湖北',126],
  ['成都理工大学','https://www.cdut.edu.cn','普通本科','四川',127],
  ['西南科技大学','https://www.swust.edu.cn','普通本科','四川',128],
  ['西华大学','https://www.xhu.edu.cn','普通本科','四川',129],
  ['重庆邮电大学','https://www.cqupt.edu.cn','普通本科','重庆',130],
  ['重庆交通大学','https://www.cqjtu.edu.cn','普通本科','重庆',131],
  ['重庆理工大学','https://www.cqut.edu.cn','普通本科','重庆',132],
  ['西北政法大学','https://www.nwupl.edu.cn','普通本科','陕西',133],
  ['西安理工大学','https://www.xaut.edu.cn','普通本科','陕西',134],
  ['西安邮电大学','https://www.xiyou.edu.cn','普通本科','陕西',135],
  ['西安建筑科技大学','https://www.xauat.edu.cn','普通本科','陕西',136],
  ['青岛大学','https://www.qdu.edu.cn','普通本科','山东',137],
  ['山东科技大学','https://www.sdust.edu.cn','普通本科','山东',138],
  ['济南大学','https://www.ujn.edu.cn','普通本科','山东',139],
  ['曲阜师范大学','https://www.qfnu.edu.cn','普通本科','山东',140],
  ['天津科技大学','https://www.tust.edu.cn','普通本科','天津',141],
  ['天津工业大学','https://www.tiangong.edu.cn','普通本科','天津',142],
  ['天津师范大学','https://www.tjnu.edu.cn','普通本科','天津',143],
  ['福建师范大学','https://www.fjnu.edu.cn','普通本科','福建',144],
  ['华侨大学','https://www.hqu.edu.cn','普通本科','福建',145],
  ['集美大学','https://www.jmu.edu.cn','普通本科','福建',146],
  ['河北大学','https://www.hbu.edu.cn','普通本科','河北',147],
  ['燕山大学','https://www.ysu.edu.cn','普通本科','河北',148],
  ['河北师范大学','https://www.hebtu.edu.cn','普通本科','河北',149],
  ['河南大学','https://www.henu.edu.cn','普通本科','河南',150],
  ['河南科技大学','https://www.haust.edu.cn','普通本科','河南',151],
  ['河南理工大学','https://www.hpu.edu.cn','普通本科','河南',152],
  ['东北财经大学','https://www.dufe.edu.cn','普通本科','辽宁',153],
  ['辽宁大学','https://www.lnu.edu.cn','普通本科','辽宁',154],
  ['大连交通大学','https://www.djtu.edu.cn','普通本科','辽宁',155],
  ['沈阳工业大学','https://www.sut.edu.cn','普通本科','辽宁',156],
  ['安徽师范大学','https://www.ahnu.edu.cn','普通本科','安徽',157],
  ['安徽工业大学','https://www.ahut.edu.cn','普通本科','安徽',158],
  ['安徽财经大学','https://www.aufe.edu.cn','普通本科','安徽',159],
  ['江西财经大学','https://www.jxufe.edu.cn','普通本科','江西',160],
  ['江西师范大学','https://www.jxnu.edu.cn','普通本科','江西',161],
  ['华东交通大学','https://www.ecjtu.edu.cn','普通本科','江西',162],
  ['湖南科技大学','https://www.hnust.edu.cn','普通本科','湖南',163],
  ['中南林业科技大学','https://www.csuft.edu.cn','普通本科','湖南',164],
  ['南华大学','https://www.usc.edu.cn','普通本科','湖南',165],
  ['昆明理工大学','https://www.kust.edu.cn','普通本科','云南',166],
  ['云南师范大学','https://www.ynnu.edu.cn','普通本科','云南',167],
  ['桂林电子科技大学','https://www.guet.edu.cn','普通本科','广西',168],
  ['广西师范大学','https://www.gxnu.edu.cn','普通本科','广西',169],
  ['广西科技大学','https://www.gxust.edu.cn','普通本科','广西',170]
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'kaoyan_db',
    waitForConnections: true,
    connectionLimit: 5
  })

  try {
    const [countResult] = await pool.query('SELECT COUNT(*) as cnt FROM school_websites')
    console.log('当前数据条数:', countResult[0].cnt)

    const [typeCols] = await pool.query("SHOW COLUMNS FROM school_websites WHERE Field = 'type'")
    console.log('当前 type 字段:', typeCols[0]?.Type || '不存在')

    // 迁移 ENUM
    if (typeCols[0]?.Type && !typeCols[0].Type.includes('普通本科')) {
      console.log('→ Step 1: 扩展 ENUM (添加普通本科，保留普通)...')
      await pool.query("ALTER TABLE school_websites MODIFY COLUMN type ENUM('985','211','双一流','普通','普通本科') DEFAULT '普通本科' COMMENT '学校类型'")
      console.log('  ✓ ENUM 已扩展')

      console.log('→ Step 2: 将 "普通" 更新为 "普通本科"...')
      const [updateResult] = await pool.query("UPDATE school_websites SET type='普通本科' WHERE type='普通'")
      console.log(`  ✓ 更新了 ${updateResult.affectedRows || 0} 行`)

      console.log('→ Step 3: 清理 ENUM (移除普通)...')
      await pool.query("ALTER TABLE school_websites MODIFY COLUMN type ENUM('985','211','双一流','普通本科') DEFAULT '普通本科' COMMENT '学校类型'")
      console.log('  ✓ ENUM 迁移完成')
    }

    // 数据不足则替换
    if (countResult[0].cnt < 20) {
      console.log('→ 清空旧数据...')
      await pool.query('DELETE FROM school_websites')

      console.log(`→ 插入 ${SCHOOLS.length} 所学校数据...`)
      for (const s of SCHOOLS) {
        await pool.query('INSERT IGNORE INTO school_websites (name, website, type, region, sort_order) VALUES (?, ?, ?, ?, ?)', s)
      }
      console.log('  ✓ 数据插入完成')
    } else {
      console.log('→ 数据已完整，跳过')
    }

    const [typeStats] = await pool.query('SELECT type, COUNT(*) as cnt FROM school_websites GROUP BY type ORDER BY FIELD(type, "985", "211", "双一流", "普通本科")')
    console.log('\n各类型数据量:')
    typeStats.forEach(r => console.log(`  ${r.type}: ${r.cnt}`))

    console.log('\n✅ 迁移完成，重启小程序即可')
  } finally {
    await pool.end()
  }
}

run().catch(e => { console.error('迁移失败:', e.message); process.exit(1) })
