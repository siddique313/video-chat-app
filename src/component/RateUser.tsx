// interface RateUserProps {
//   onRate: (rating: number) => void;
//   isVisible: boolean;
//   onClose: () => void;
// }

// const RateUser = ({ onRate, isVisible, onClose }: RateUserProps) => {
//   if (!isVisible) return null;

//   return (
//     <div className="absolute top-20 right-4 bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/20 z-20">
//       <div className="flex justify-between items-center mb-2">
//         <p className="text-white text-sm font-medium">Rate this conversation</p>
//         <button onClick={onClose} className="text-gray-400 hover:text-white">
//           ×
//         </button>
//       </div>
//       <div className="flex gap-1 justify-center">
//         {[1, 2, 3, 4, 5].map((star) => (
//           <button
//             key={star}
//             onClick={() => onRate(star)}
//             className="text-2xl hover:scale-125 transition-transform duration-200"
//             style={{ color: star <= 3 ? "#fbbf24" : "#f59e0b" }}
//           >
//             ⭐
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };
