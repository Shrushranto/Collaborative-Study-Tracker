import { useRef, useState } from 'react';

export default function DraggableCard({ id, span, editMode, onReorder, onEnterEditMode, onToggleSpan, children }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const ref = useRef(null);
  const pressTimer = useRef(null);

  function handleDragStart(e) {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Slight delay to allow the drag image to be captured before we lower opacity
    setTimeout(() => {
      if (ref.current) ref.current.classList.add('dragging');
    }, 0);
  }

  function handleDragEnd() {
    setIsDragging(false);
    if (ref.current) ref.current.classList.remove('dragging');
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragging) setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== id) {
      onReorder(draggedId, id);
    }
  }

  function handlePointerDown() {
    if (editMode) return;
    pressTimer.current = setTimeout(() => {
      onEnterEditMode();
      // Provide haptic feedback if available on mobile
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  }

  function handlePointerUpOrLeave() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  return (
    <div
      ref={ref}
      className={`card ${isDragOver ? 'drag-over' : ''} ${editMode ? 'edit-mode' : ''} ${span === 2 ? 'card-span-2' : ''}`}
      draggable={editMode}
      onDragStart={editMode ? handleDragStart : undefined}
      onDragEnd={editMode ? handleDragEnd : undefined}
      onDragOver={editMode ? handleDragOver : undefined}
      onDragLeave={editMode ? handleDragLeave : undefined}
      onDrop={editMode ? handleDrop : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrLeave}
      onPointerLeave={handlePointerUpOrLeave}
      style={{ position: 'relative', touchAction: editMode ? 'none' : 'auto' }}
    >
      {editMode && (
        <>
          <div className="resize-handle" onClick={(e) => { e.stopPropagation(); onToggleSpan(id); }} title="Resize component" aria-label="Resize">
            ⤡
          </div>
          <div className="drag-handle" title="Drag to reorder" aria-label="Drag handle">
            ⋮⋮
          </div>
        </>
      )}
      {children}
    </div>
  );
}
