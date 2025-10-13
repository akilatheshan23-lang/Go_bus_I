import React from 'react';

export default function SeatMap({ seats = [], selected = [], onToggle = () => {} }) {
  // Group seats by row
  const rows = {};
  seats.forEach(s => {
    if (!rows[s.row]) rows[s.row] = [];
    rows[s.row].push(s);
  });

  const Seat = ({ s }) => {
    const isSelected = selected.includes(s.id);
    let seatClasses = 'w-9 h-9 text-xs p-1 m-0.5 border transition-colors';
    let seatStyle = {};
    
    if (s.status === 'booked') {
      seatClasses += ' bg-red-100 border-red-500 text-red-700 cursor-not-allowed';
    } else if (s.status === 'held') {
      seatClasses += ' bg-gray-100 border-gray-400 text-gray-600 cursor-not-allowed';
    } else if (isSelected) {
      seatClasses += ' bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200';
    } else {
      seatClasses += ' bg-green-100 border-green-500 text-green-700 hover:bg-green-200';
    }
    
    const disabled = s.status !== 'available';
    
    return (
      <button
        disabled={disabled}
        onClick={() => onToggle(s.id)}
        className={seatClasses}
        title={s?.isWindow ? 'Window seat' : 'Seat'}
      >
        {s?.label || '?'}
      </button>
    );
  };

  const keys = Object.keys(rows).map(Number).sort((a, b) => a - b);
  
  if (keys.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <div>Seat map will appear once the seats are loaded...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-400 rounded"></div>
            <span>Held</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div>
            <span>Booked</span>
          </div>
        </div>
      </div>
      
      {/* Seat Layout */}
      <div className="bg-white rounded-lg shadow-sm p-4 text-center">
        {keys.map(k => {
          const row = rows[k].sort((a, b) => a.col - b.col);
          const isLastRow = k === 11; // Last row has 6 seats

          return (
            <div key={k} className="flex justify-center items-center gap-2 mb-1">
              {/* Left side seats (or all seats for last row) */}
              <div className="flex gap-0.5">
                {isLastRow ? (
                  // Last row: all 6 seats together
                  row.map(seat => <Seat key={seat.id} s={seat} />)
                ) : (
                  // Regular rows: first 2 seats
                  <>
                    <Seat s={row[0]} />
                    <Seat s={row[1]} />
                  </>
                )}
              </div>
              
              {/* Aisle space (not for last row) */}
              {!isLastRow && (
                <div className="w-5 text-center text-xs text-gray-400">
                  |
                </div>
              )}
              
              {/* Right side seats (not for last row) */}
              {!isLastRow && (
                <div className="flex gap-0.5">
                  <Seat s={row[2]} />
                  <Seat s={row[3]} />
                  <Seat s={row[4]} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}