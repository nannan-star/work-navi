// 预置数据:默认分类(仅「原型」) + 最近几周周记。
// 运行:npm run db:seed

import { PrismaClient } from "@prisma/client";
import { getWeekInfo, formatWeekRange } from "../src/lib/week";

const prisma = new PrismaClient();

async function main() {
  // 清空(开发用)
  await prisma.resource.deleteMany();
  await prisma.weekNote.deleteMany();
  await prisma.project.deleteMany();
  await prisma.category.deleteMany();

  // 1. 默认项目 + 默认分类:仅保留「原型」
  const project = await prisma.project.create({
    data: { name: "示例项目", desc: "演示用项目,可删除", color: "indigo" },
  });
  await prisma.category.create({ data: { projectId: project.id, name: "原型", color: "proto", order: 0 } });

  // 2. 最近 4 周周记(当前周 + 前 3 周)
  const cur = getWeekInfo();
  const weeks = [
    {
      off: 0,
      content: "## 本周重点\n- [x] 订单状态机重构 PR 合并\n- [ ] 库存扣减防超卖压测（周四前）\n- [ ] 联调支付回调 → 找老王要沙箱密钥\n\n## 待排期\n- 商品域缓存改造\n- 老接口下线（等前端全量切换）\n\n## 备忘\n- 生产发布窗口：每周二/四 20:00\n- prod 密码下次轮换：3/15",
    },
    {
      off: 1,
      content: "## 本周重点\n- [x] 完成商品详情页重构\n- [x] 修复库存超卖 bug（乐观锁 + 重试）\n- [x] 周会评审 PRD v2.3，已通过\n\n## 备忘\n- 下周开始接支付回调",
    },
    {
      off: 2,
      content: "## 本周重点\n- [x] 搭建 CI/CD 流水线（GitLab Runner）\n- [x] 接入监控告警（Prometheus + 钉钉）\n- [x] 整理三大环境配置文档\n- [x] 数据库读写分离验证\n- [x] 压测基线报告",
    },
    {
      off: 3,
      content: "## 本周重点\n- [x] 项目启动会\n- [x] 技术选型评审（Spring Cloud + Nacos）\n- [x] 拆分订单/商品/库存三大域\n- [x] 搭建脚手架 & 代码规范",
    },
  ];

  for (const w of weeks) {
    const monday = new Date(cur.startDate);
    monday.setUTCDate(monday.getUTCDate() - w.off * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const iso = getWeekInfo(monday);
    await prisma.weekNote.create({
      data: {
        isoYear: iso.isoYear,
        isoWeek: iso.isoWeek,
        startDate: monday,
        endDate: sunday,
        content: w.content,
      },
    });
  }

  const pCount = await prisma.project.count();
  const rCount = await prisma.resource.count();
  const cCount = await prisma.category.count();
  const wCount = await prisma.weekNote.count();
  console.log(`✅ 预置完成:${pCount} 项目 / ${rCount} 资源 / ${cCount} 分类 / ${wCount} 周周记`);
  console.log(`   当前周:${cur.label}(${formatWeekRange(cur.isoYear, cur.isoWeek)})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
