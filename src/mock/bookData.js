// src/mock/bookData.js

export default {
  books: [
    {
      id: 1,
      title: '《活着》',
      author: '余华',
      price: 50.00,
      cover: 'https://cbu01.alicdn.com/img/ibank/O1CN017cKAQs1vm49hxvx1x_!!2200552026214-0-cib.310x310.jpg',
      desc: '讲述了人如何去承受巨大的痛苦，讲述了眼泪的宽广和丰富。',
      videoUrl: '/videos/alive.mp4',
      category: '文学' // 余华的作品属于文学
    },
    {
      id: 2,
      title: '《百年孤独》',
      author: '加西亚·马尔克斯',
      price: 45.00,
      cover: 'https://p1.ssl.qhimg.com/t017c401645dd63e333.png',
      desc: '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。',
      videoUrl: '/videos/One-Hundred-Years-of-Solitude.mp4',
      category: '文学' // 经典文学作品
    },
    { 
      id: 3, 
      title: '全球风口',
      author: '李志飞', 
      price: 49.00,
      cover: 'https://book.img.zhangyue01.com/idc_1/m_1,w_156,h_208,q_100/78ace733/group6/M00/6C/A7/CmQUN1avME-ERuNIAAAAAPDdXck985411589.jpg?v=fhHD3ozQ&t=CmQUN1lQzJI.',
      desc: '王煜全与薛兆丰解析积木式创新，共探中国发展机遇',
      category: '经济' // 涉及创新和机遇，归为经济或管理，这里选经济
    },
    { 
      id: 5, 
      title: '自我伤害防治', 
      author: '心理学协会',
      price: 35.50,
      desc: '解析自伤成因与心理机制，给出科学干预方法，守护心理健康，远离自我伤害。',
      cover: 'https://book.img.zhangyue01.com/idc_1/m_1,w_156,h_208,q_100/7cc5c05e/group6/M00/6B/A0/CmQUNlal4suEXe7RAAAAABlQTtA176776530.jpg?v=cd0pymhX',
      category: '科技' // 心理学通常归类于社会科学或科技类下的应用科学
    },
    { 
      id: 4, 
      title: '高手下山我有九个无敌师傅', 
      author: '小殇殇', 
      price: 42.00, 
      desc: '富可敌国！和我比美人？我有七个倾国倾城的师姐，个个都很宠我！',
      videoUrl: '/videos/sifu.mp4',
      cover: 'https://p9-novel-sign.byteimg.com/novel-pic/263ac5c6e7d114111edbb597175dcfb1~tplv-resize:225:300.image?lk3s=191c1ecc&x-expires=1774419276&x-signature=kYHUssNO6BJ9vQHR7%2BEdT5hIepk%3D',
      category: '幽默' // 从标题和简介看，偏向轻松幽默的网络小说
    },
    { 
      id: 6, 
      title: '认同感', 
      author: '社会学博士',
      price: 38.00,
      desc: '本书讲故事思维，助你塑造认同、提升社交与影响力',
      cover: 'https://book.img.zhangyue01.com/idc_1/m_1,w_156,h_208,q_100/fb6a5be4/group6/M00/70/76/CmQUN1bNDKSEfCADAAAAABemVKo198144708.jpg?v=5gSmBzrf&t=CmQUN11HnCI.',
      category: '管理' // 涉及社交与影响力，可归为管理类或社科类，这里选管理
    },
    { 
      id: 7, 
      title: 'Vue.js 实战', 
      author: '前端专家',
      price: 79.00,
      desc: '渐进式学 Vue 项目实战掌握前端开发',
      cover: 'https://img.alicdn.com/bao/uploaded/i1/303366239/O1CN01rDzduR1vxVv6yYYaC_!!0-item_pic.jpg',
      category: '科技' // 编程技术书籍
    },
    { 
      id: 8, 
      title: 'Spring Boot+MVC 实战指南',
      author: 'Java 大神',
      price: 89.00, 
      desc: '快速掌握企业级开发',
      cover: 'https://img.alicdn.com/bao/uploaded/i4/3581383324/O1CN01jxri2A1aQROVkmMtQ_!!0-item_pic.jpg',
      category: '科技' // 编程技术书籍
    },
    { 
      id: 9, 
      title: '十日终焉',
      author: '陈俊男', 
      price: 128.00,
      desc: '十日轮回绝境求生，众人闯关解谜，齐夏率众破局逃离终焉之地',
      videoUrl: '/videos/Ten-Day.mp4',
      cover: 'https://p9-novel-sign.byteimg.com/novel-pic/4900f950c7af7f82fdc14cf528e0e288~tplv-resize:225:300.image?lk3s=191c1ecc&x-expires=1774419604&x-signature=t8WzmxmAx0KCT%2FBzScg3EgZqxEI%3D',
      category: '推理' // 闯关解谜题材
    },
    { 
      id: 10, 
      title: '我不是戏神',
      author: '三九音域',
      price: 65.00, 
      desc: '陈伶穿越末世，以戏神道求生，借戏曲演生死，在诡异世界逆天破局！',
      videoUrl: '/videos/actor-god.mp4',
      cover: 'https://p3-novel-sign.byteimg.com/novel-pic/p2o99ffbfd13492eb9953715959db26ed9b~tplv-resize:225:300.image?lk3s=191c1ecc&x-expires=1774419666&x-signature=dSuVbUuqzQCLQXThtaFa%2BOrt%2Bk4%3D',
      category: '科幻' // 末世、穿越、诡异世界，偏向科幻或奇幻
    },
    // --- 热门推荐区数据 ---
    { 
      id: 11, 
      title: '三体', 
      author: '刘慈欣', 
      price: 58.00, 
      desc: '地球文明与三体文明的生死博弈。', 
      cover: 'https://img.alicdn.com/bao/uploaded/i1/2574783598/O1CN01z7Wtc61cRvbQSJ3uW_!!0-item_pic.jpg',
      category: '科幻' 
    },
    { 
      id: 12, 
      title: '堂吉诃德', 
      author: '米格尔・德・塞万提斯・萨维德拉', 
      price: 45.00, 
      desc: '沉迷骑士小说的乡绅游侠，荒诞中坚守理想', 
      cover: 'https://img.alicdn.com/bao/uploaded/i1/2890685839/O1CN01xxdX1A1t0JIbw52Iz_!!0-item_pic.jpg',
      category: '文学' 
    },
    { 
      id: 13, 
      title: '人类简史', 
      author: '尤瓦尔', 
      price: 52.00, 
      desc: '从动物到上帝，人类历史的宏大叙事。', 
      cover: 'https://img.alicdn.com/bao/uploaded/i1/2455255647/O1CN011cCVwk1raNLFLKYYt_!!0-item_pic.jpg',
      category: '历史' 
    },
    { 
      id: 14, 
      title: '解忧杂货店', 
      author: '东野圭吾', 
      price: 39.00, 
      desc: '穿越时空的信件，治愈人心的故事。', 
      cover: 'https://ts1.tc.mm.bing.net/th/id/OIP-C.v-_BhEb7l5KWQyHuqOmmngHaHV?rs=1&pid=ImgDetMain&o=7&rm=3',
      category: '文学' // 虽然作者是推理作家，但此书更偏向温情文学
    },
    { 
      id: 15, 
      title: '月亮与六便士', 
      author: '毛姆', 
      price: 36.00, 
      desc: '满地都是六便士，他却抬头看见了月亮。', 
      cover: 'https://uimgproxy.suning.cn/uimg1/sop/commodity/Yqfs-DRGtPpTejr0Ad6yFQ.jpg',
      category: '文学' 
    },
    { 
      id: 16, 
      title: '围城', 
      author: '钱钟书', 
      price: 32.00, 
      desc: '婚姻是一座围城，城外的人想进去，城里的人想出来。', 
      cover: 'https://img.alicdn.com/bao/uploaded/O1CN01ut3H3G1Vqw2ok76Xj_!!6000000002705-0-yinhe.jpg',
      category: '文学' 
    },
    { 
      id: 17, 
      title: '白夜行', 
      author: '东野圭吾', 
      price: 42.00, 
      desc: '绝望的爱与罪恶，在黑夜中同行。', 
      cover: 'https://ts2.tc.mm.bing.net/th/id/OIP-C.wY3Elxmzd_Xp-NhELjn2cgHaJr?rs=1&pid=ImgDetMain&o=7&rm=3',
      category: '推理' 
    },
    { 
      id: 18, 
      title: '平凡的世界', 
      author: '路遥', 
      price: 75.00, 
      desc: '普通人在大时代历史进程中所走过的艰难曲折的道路。', 
      cover: 'https://img14.360buyimg.com/pop/s500x500_jfs/t1/163758/21/22851/49933/6556d41eF6db119ae/5b453daa6d8a446b.jpg',
      category: '文学' 
    },
    { 
      id: 19, 
      title: '红楼梦', 
      author: '曹雪芹', 
      price: 59.00, 
      desc: '中国古典小说的巅峰，封建社会的百科全书。', 
      cover: 'https://ts1.tc.mm.bing.net/th/id/OIP-C.zJdoPjiwyKuApLBDArHJvwHaKk?rs=1&pid=ImgDetMain&o=7&rm=3',
      category: '文学' 
    },
    { 
      id: 20, 
      title: '1984', 
      author: '奥威尔', 
      price: 35.00, 
      desc: '极权主义的恐怖预言，老大哥在看着你。', 
      cover: 'https://ts3.tc.mm.bing.net/th/id/OIP-C.u1JCm1eDfbUe-OLUrtS8GAHaKp?rs=1&pid=ImgDetMain&o=7&rm=3',
      category: '科幻' // 反乌托邦科幻经典
    },
    { 
      id: 21, 
      title: '小王子', 
      author: '圣埃克苏佩里', 
      price: 28.00, 
      desc: '献给大人的童话，关于爱与责任。', 
      cover: 'https://img.alicdn.com/i4/2263306098/O1CN01wdlSPN1uuvzjURcD3_!!2263306098.jpg',
      category: '少儿' // 经典儿童文学
    },
    { 
      id: 22, 
      title: '哈利·波特', 
      author: 'J.K.罗琳', 
      price: 68.00, 
      desc: '魔法世界的奇幻冒险，友谊与勇气的赞歌。', 
      cover: 'https://pic2.zhimg.com/v2-37c6c18987e9926259acee8aebe066df_r.jpg?source=1940ef5c',
      category: '少儿' // 青少年奇幻文学
    },
    { 
      id: 23, 
      title: '追风筝的人', 
      author: '卡勒德·胡赛尼', 
      price: 38.00, 
      desc: '为你，千千万万遍。关于救赎与成长的感人故事。', 
      cover: 'https://imgservice.suning.cn/uimg1/b2c/image/RkuC4kgL9oxQSgpOyZUkuA.jpg_800w_800h_4e',
      category: '文学' 
    },
    { 
      id: 24, 
      title: '老人与海', 
      author: '海明威', 
      price: 28.00, 
      desc: '人可以被毁灭，但不能被打败，硬汉精神的不朽象征。', 
      cover: 'https://img3m3.ddimg.cn/78/8/25858383-1_w_1721109012.jpg',
      category: '文学' 
    },
    { 
      id: 25, 
      title: '万历十五年', 
      author: '黄仁宇', 
      price: 42.00, 
      desc: '从细微处读懂大明王朝，独特视角解读历史兴衰。', 
      cover: 'https://img3m5.ddimg.cn/14/0/12328932245-1_u_1766467954.jpg',
      category: '历史' 
    },
    { 
      id: 26, 
      title: '诡秘之主', 
      author: '爱潜水的乌贼', 
      price: 45.00, 
      desc: '克苏鲁 + 西方玄幻，设定严谨、剧情烧脑。', 
      cover: 'https://img3m3.ddimg.cn/56/1/29961713-1_u_1766545786.jpg',
      category: '科幻' // 克苏鲁元素通常归为科幻或奇幻
    },
    { 
      id: 27, 
      title: '雪中悍刀行', 
      author: '烽火戏诸侯', 
      price: 48.00, 
      desc: '江湖侠义与庙堂权谋，文笔惊艳的古风玄幻大作。', 
      cover: 'https://img3m1.ddimg.cn/80/8/29337641-1_w_3.jpg',
      category: '文学' // 网络文学大作
    },
    { 
      id: 28, 
      title: '盗墓笔记', 
      author: '南派三叔', 
      price: 42.00, 
      desc: '惊险悬疑探墓，揭秘古墓秘闻与千年谜团。', 
      cover: 'https://img3m2.ddimg.cn/60/6/29288022-1_w_1773308621.jpg',
      category: '推理' // 悬疑探险题材
    },
    { 
      id: 29, 
      title: '灵境行者', 
      author: '卖报小郎君', 
      price: 45.00, 
      desc: '都市异能巅峰之作，世界观新颖，剧情紧凑。', 
      cover: 'https://img3m7.ddimg.cn/64/36/11740943377-1_w_1714358063.jpg',
      category: '科幻' // 都市异能常归为科幻或奇幻
    },
    { 
      id: 30, 
      title: '剑来', 
      author: '烽火戏诸侯', 
      price: 58.00, 
      desc: '仙侠网文巅峰之作，讲尽江湖道义与人间道理。', 
      cover: 'https://img3m8.ddimg.cn/95/11/29890868-1_w_1772092874.jpg',
      category: '文学' // 网络文学大作
    }
  ]
};