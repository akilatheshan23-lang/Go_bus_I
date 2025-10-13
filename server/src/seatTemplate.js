export function seatTemplate56() {
  const seats = [];
  let num = 1;
  
  // Rows 1-10 with 5 seats each (2-2-1 layout)
  for (let r = 1; r <= 10; r++) {
    for (let pos = 1; pos <= 5; pos++) {
      const isWindow = (pos === 1 || pos === 5);
      seats.push({
        id: String(num),
        label: String(num) + (isWindow ? 'W' : ''),
        row: r,
        col: pos,
        isWindow
      });
      num++;
    }
  }
  
  // Last row (row 11) with 6 seats
  const lastRow = 11;
  for (let pos = 1; pos <= 6; pos++) {
    const isWindow = (pos === 1 || pos === 6);
    seats.push({
      id: String(num),
      label: String(num) + (isWindow ? 'W' : ''),
      row: lastRow,
      col: pos,
      isWindow
    });
    num++;
  }
  
  return seats;
}