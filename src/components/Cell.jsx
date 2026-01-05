export default function Cell({ value, onClick, isLastAI, isWinCell }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        border: "1px solid #999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        cursor: "pointer",
        backgroundColor: isWinCell
          ? "#ff7875"
          : isLastAI
          ? "#ffe58f"
          : "white",
        color: isWinCell ? "white" : "black",
      }}
    >
      {value === 1 ? "🤖" : value === -1 ? "❌" : ""}
    </div>
  );
}
