import request from '@/utils/request';
import { ElMessage } from 'element-plus';

export async function loadAddressList() {
  try {
    const res = await request.get('/user/address-book/list');
    return Array.isArray(res) ? res : [];
  } catch (e) {
    console.error('加载地址列表失败', e);
    return [];
  }
}

export async function addAddress(payload) {
  try {
    const res = await request.post('/user/address-book/add', payload);
    return res;
  } catch (e) {
    console.error('新增地址失败', e);
    ElMessage.error('新增地址失败');
    throw e;
  }
}

export async function editAddress(payload) {
  try {
    const res = await request.put('/user/address-book/edit', payload);
    return res;
  } catch (e) {
    console.error('更新地址失败', e);
    ElMessage.error('更新地址失败');
    throw e;
  }
}

export async function deleteAddress(id) {
  try {
    const res = await request.delete(`/user/address-book/${id}`);
    return res;
  } catch (e) {
    console.error('删除地址失败', e);
    ElMessage.error('删除地址失败');
    throw e;
  }
}

export async function setDefaultAddress(id) {
  try {
    const res = await request.put(`/user/address-book/default/${id}`);
    return res;
  } catch (e) {
    console.error('设置默认地址失败', e);
    ElMessage.error('设置默认地址失败');
    throw e;
  }
}

export default function useAddress() {
  return { loadAddressList, addAddress, editAddress, deleteAddress, setDefaultAddress };
}
