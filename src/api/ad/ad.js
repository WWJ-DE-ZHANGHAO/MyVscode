import request from '@/utils/request'

export function listAd(data) {
  return request.get('/admin/ad/list')
}

export function getAd(id) {
  return request.get(`/admin/ad/${id}`)
}

export function delAd(id) {
  return request.delete('/admin/ad/delete', { params: { id } })
}

export function addAd(data) {
  return request.post('/admin/ad/add', data)
}

export function updateAd(data) {
  return request.put('/admin/ad/edit', data)
}

export default {
  listAd,
  getAd,
  delAd,
  addAd,
  updateAd
}
