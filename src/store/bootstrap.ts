/**
 * 应用启动引导
 * 必须在任何 store 初始化（读取 localStorage）之前执行：
 * 1. 注册迁移函数（import migrations 的副作用）
 * 2. 同步执行数据迁移，把旧版本数据升级到最新格式
 */
import { ensureStorageMigrated } from './persistence'
import './migrations'

ensureStorageMigrated()
