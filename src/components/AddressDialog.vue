<template>
  <el-dialog :title="dialogTitle" v-model="visible" width="720px" append-to-body destroy-on-close>
    <el-form :model="form" :rules="rules" ref="addressForm" label-width="100px" class="address-form">
      <!-- 三级级联选择器（仅显示省/市/区名称，无编号） -->
      <el-form-item label="地址信息" prop="location">
        <el-cascader
          v-model="form.location"
          :options="areaOptions"
          :props="cascaderProps"
          placeholder="请选择省 / 市 / 区"
          clearable
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="详细地址" prop="detail">
        <el-input v-model="form.detail" placeholder="街道、门牌号、门店名等" />
      </el-form-item>

      <el-form-item label="收货人" prop="name">
        <div class="inline-row">
          <el-input v-model="form.name" placeholder="收货人姓名" class="flex-input" />
          <el-radio-group v-model="form.gender" size="small" class="gender-group">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </div>
      </el-form-item>

      <el-form-item label="手机号码" prop="phone">
        <div class="inline-row">
          <el-select v-model="form.countryCode" size="small" style="width:120px">
            <el-option label="中国大陆 +86" value="+86" />
          </el-select>
          <el-input v-model="form.phone" placeholder="请输入手机号" class="flex-input" />
        </div>
        <div class="tag-row">
          <!-- 仅保留「家、公司、学校」三个预设标签 -->
          <el-button
            v-for="t in ['家','公司','学校']"
            :key="t"
            size="small"
            :type="form.tag === t ? 'primary' : 'default'"
            @click="selectTag(t)"
          >
            {{ t }}
          </el-button>
          <el-button size="small" @click="enableCustomTag">自定义</el-button>
          <el-input v-if="customTagEnabled" v-model="form.tag" placeholder="自定义标签" style="width:140px;margin-left:8px" />
        </div>
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="form.isDefault">设置为默认收货地址</el-checkbox>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button class="btn-save" :loading="saving" @click="onSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { addAddress, editAddress } from '@/composables/useAddress';
import areaData from '@/assets/data.json';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  address: { type: Object, default: null }
});
const emit = defineEmits(['update:modelValue', 'saved']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
});

const dialogTitle = computed(() => (props.address && props.address.id) ? '编辑收货地址' : '新增收货地址');

const addressForm = ref(null);
const saving = ref(false);
const form = reactive({ 
  id: null, 
  location: [], // 存储 [省名, 市名, 区名]
  detail: '', 
  name: '', 
  gender: '男', 
  countryCode: '+86', 
  phone: '', 
  tag: '家', // 默认标签为「家」
  isDefault: false 
});
const customTagEnabled = ref(false);

// 级联选择器核心配置（修复checkStrictly，强制选到第三级）
const cascaderProps = {
  label: 'label',
  value: 'label',
  children: 'children',
  expandTrigger: 'click',
  checkStrictly: true, // 改为true：必须选择到最后一级（区），无法只选省/市
  emitPath: true
};

// 格式化 data.json 为级联数据（仅保留名称）
const formatAreaData = (rawData) => {
  const rootProvinces = rawData['86'] || {};
  return Object.entries(rootProvinces).map(([provinceCode, provinceName]) => {
    const province = { label: provinceName, value: provinceName, children: [] };
    const cityList = rawData[provinceCode] || {};
    province.children = Object.entries(cityList).map(([cityCode, cityName]) => {
      const city = { label: cityName, value: cityName, children: [] };
      const districtList = rawData[cityCode] || {};
      city.children = Object.entries(districtList).map(([districtCode, districtName]) => ({
        label: districtName, value: districtName, children: []
      }));
      return city;
    });
    return province;
  });
};

const areaOptions = ref(formatAreaData(areaData));

// 表单校验规则（核心修复：自定义数组长度校验，替代min:3）
const rules = {
  name: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  location: [
    { required: true, message: '请选择地区', trigger: 'change' },
    // 自定义校验：强制数组长度必须为3（省/市/区完整）
    {
      validator: (rule, value, callback) => {
        if (!value || !Array.isArray(value) || value.length !== 3) {
          callback(new Error('请选择完整的省/市/区'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: ['blur', 'change'] }
  ],
  detail: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
};

// 地址标签相关方法
const selectTag = (t) => { form.tag = t; customTagEnabled.value = false; };
const enableCustomTag = () => { customTagEnabled.value = true; form.tag = ''; };

// 取消按钮逻辑
const handleCancel = () => { 
  visible.value = false;
  form.location = [];
  customTagEnabled.value = false;
};

// 提交表单逻辑
const onSubmit = async () => {
    addressForm.value.validate(async (valid) => {
      if (!valid) return;
      const [provinceName, cityName, districtName] = form.location;
      const payload = {
        id: form.id,
        receiverName: form.name,
        gender: form.gender === '男' ? 1 : 2,
        phone: form.phone,
        provinceCode: getCodeByLevelAndName(1, provinceName),
        cityCode: getCodeByLevelAndName(2, provinceName, cityName),
        districtCode: getCodeByLevelAndName(3, provinceName, cityName, districtName),
        provinceName: provinceName || '',
        cityName: cityName || '',
        districtName: districtName || '',
        detailAddress: form.detail,
        // 标签映射：仅保留 1=家、2=公司、3=学校
        label: form.tag === '公司' ? 2 : form.tag === '学校' ? 3 : 1,
        isDefault: form.isDefault ? 1 : 0
      };

      saving.value = true;
      try {
        if (form.id) {
          await editAddress(payload);
          ElMessage.success('更新地址成功');
        } else {
          await addAddress(payload);
          ElMessage.success('新增地址成功');
        }
        emit('saved');
        visible.value = false;
        form.location = [];
        customTagEnabled.value = false;
      } catch (e) {
        console.error('保存地址失败', e);
      } finally {
        saving.value = false;
      }
    });
};

// 根据名称反向查找地区 code
const getCodeByLevelAndName = (level, ...names) => {
  const [provinceName, cityName, districtName] = names;
  let targetCode = '';

  if (level >= 1) {
    const provinceEntry = Object.entries(areaData['86'] || {}).find(([code, name]) => name === provinceName);
    targetCode = provinceEntry ? provinceEntry[0] : '';
  }
  if (level >= 2 && targetCode) {
    const cityEntry = Object.entries(areaData[targetCode] || {}).find(([code, name]) => name === cityName);
    targetCode = cityEntry ? cityEntry[0] : '';
  }
  if (level >= 3 && targetCode) {
    const districtEntry = Object.entries(areaData[targetCode] || {}).find(([code, name]) => name === districtName);
    targetCode = districtEntry ? districtEntry[0] : '';
  }

  return targetCode;
};

// 根据 code 查 name（用于回显当后端只返回 code 时）
const getNameByCode = (level, ...codes) => {
  const [provinceCode, cityCode, districtCode] = codes;
  if (level === 1) {
    return (areaData['86'] && areaData['86'][provinceCode]) || '';
  }
  if (level === 2) {
    return (areaData[provinceCode] && areaData[provinceCode][cityCode]) || '';
  }
  if (level === 3) {
    return (areaData[cityCode] && areaData[cityCode][districtCode]) || '';
  }
  return '';
};

// 监听弹窗显示，初始化表单（修复：确保数组长度为3，不filter空值）
watch(() => visible.value, (v) => {
  if (v && props.address && props.address.id) {
    const data = props.address;
    form.id = data.id || null;
    form.name = data.receiverName || data.consignee || '';
    form.gender = data.gender === 1 ? '男' : data.gender === 2 ? '女' : '男';
    form.countryCode = '+86';
    form.phone = data.phone || '';
    // 支持后端返回名称或仅返回编号的两种情况
    let pName = data.provinceName || '';
    let cName = data.cityName || '';
    let dName = data.districtName || '';
    if ((!pName || !cName || !dName) && (data.provinceCode || data.cityCode || data.districtCode)) {
      // 尝试用 code -> name 映射回显
      pName = pName || getNameByCode(1, data.provinceCode);
      cName = cName || getNameByCode(2, data.provinceCode, data.cityCode);
      dName = dName || getNameByCode(3, data.provinceCode, data.cityCode, data.districtCode);
    }
    // 不使用filter(Boolean)，强制补全3级，避免数组长度不足
    form.location = [pName || '', cName || '', dName || ''];
    form.detail = data.detailAddress || '';
    // 标签映射（仅适配家/公司/学校）
    const tagMap = { 1: '家', 2: '公司', 3: '学校' };
    form.tag = tagMap[data.label] || '家';
    form.isDefault = !!data.isDefault;
    customTagEnabled.value = !!form.tag && !['家','公司','学校'].includes(form.tag);
  } else if (v) {
    // 新增地址重置表单
    form.id = null;
    form.location = [];
    form.detail = '';
    form.name = '';
    form.gender = '男';
    form.countryCode = '+86';
    form.phone = '';
    form.tag = '家';
    form.isDefault = false;
    customTagEnabled.value = false;
  }
});
</script>

<style scoped>
.address-form .inline-row { display:flex; gap:12px; align-items:center }
.address-form .flex-input { flex:1 }
.address-form .gender-group { min-width:100px; display:flex; gap:8px }
.address-form .tag-row { margin-top:8px; display:flex; gap:8px; align-items:center }
.btn-save { background:#ff5000; border-color:#ff5000; color:#fff }

/* 级联选择器样式优化 */
:deep(.el-cascader-menu) { max-height: 300px; }
:deep(.el-cascader-menu__item) { padding: 8px 16px; }
:deep(.el-cascader-menu__item--active) { background-color: #fff3e8; color: #ff5000; }
</style>