export function isLeapYear(year:Date){
    const actualYear = year.getFullYear();
    if (actualYear % 4 == 0 && (actualYear % 100 != 0 || actualYear % 400 == 0 )){
        return true;
    }
    return false
}