import  dataRow from './Datarow';
const fakeData: dataRow =
  {status:"check",
  content:"there once was a man a long time ago",
  humanLabel:"history",
  index:0,
  isEnable:"yes",
  isSelected:"yes",
  predictions:"fiction"}


function generateData(max:number): dataRow[]{
  let result:dataRow[] =[]
  for(let i=0;i<max;i++){
    result.push({...fakeData,index:i})
  }
  return result;
}

export default generateData
