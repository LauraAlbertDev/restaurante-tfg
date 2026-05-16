import {
  Component, OnInit, AfterViewInit, inject, signal, OnDestroy, ViewChild, ElementRef, computed, effect, untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Canvas, Group, Rect, Circle, IText, Object as FabricObject, TOriginX, TOriginY, util } from 'fabric';
import { TablesService } from '../../../../services/tables_service';
import { OrderService } from '../../../../services/order-service';
import { AuthService } from '../../../../services/auth-service';
import { Subscription } from 'rxjs';
import { MapTool, STATUS_COLORS, TableStatus } from '../../../../common/interfaces/interfaces';
import { formatDateToISO, getTodayISO } from '../../../../common/utils/date-utils';
import { ReservationsService } from '../../../../services/reservation-service';
import {UiService} from '../../../../services/ui-service';

const GRID_SIZE = 20;

@Component({
  selector: 'app-table-map',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './table-map.html',
  styleUrl: './table-map.css',
})
export class TableMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly tablesService = inject(TablesService);
  private readonly orderService = inject(OrderService);
  private readonly ui = inject(UiService);
  protected readonly auth = inject(AuthService);
  private readonly reservationService = inject(ReservationsService);

  public isLocked = signal(true);
  public areaName = signal('Salón principal');
  public selectedDate = signal(getTodayISO());
  public minDate = signal(getTodayISO());

  public maxDate = computed(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return formatDateToISO(new Date(date.getFullYear(), date.getMonth(), 0));
  });

  @ViewChild('container', { static: false }) container!: ElementRef;
  private canvas!: Canvas;
  private subscriptions = new Subscription();

  public readonly editTools: MapTool[] = [
    { icon: 'bi-square', class: 'btn-success', title: 'Rectangular', action: () => this.addTable('rect') },
    { icon: 'bi-circle', class: 'btn-warning', title: 'Circular', action: () => this.addTable('circle') },
    { icon: 'bi-copy', class: 'btn-secondary', title: 'Duplicar', action: () => this.duplicateSelected() },
    { icon: 'bi-arrow-clockwise', class: 'btn-secondary', title: 'Rotar', action: () => this.rotateSelected() },
    { icon: 'bi-trash', class: 'btn-danger', title: 'Eliminar', action: () => this.deleteSelected() }
  ];

  constructor() {
    // 🌟 SEÑALES CONTROLADAS: Usamos 'untracked' para evitar sub-suscripciones cíclicas con Fabric
    effect(() => {
      this.orderService.allActiveOrders();
      const date = this.selectedDate();

      if (this.canvas) {
        untracked(() => {
          setTimeout(() => { this.syncTableColors(); }, 50);
        });
      }
    });
  }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  ngAfterViewInit(): void {
    this.setupCanvas();
    this.loadFloorPlan();
  }

  ngOnDestroy(): void {
    this.canvas?.dispose();
    this.subscriptions.unsubscribe();
  }

  private setupCanvas(): void {
    this.canvas = new Canvas('canvasMesas', {
      hoverCursor: 'pointer',
      selection: true,
      enableRetinaScaling: true
    });

    this.resizeCanvas();
    this.attachCanvasEvents();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private initSubscriptions(): void {
    // Escuchador reactivo para cuando se libera la mesa desde clearOrder
    this.subscriptions.add(
      this.orderService.tableReleased$.subscribe(() => {
        this.syncTableColors();
      })
    );
  }

  public addTable(shapeType: 'rect' | 'circle'): void {
    const nextNum = this.getNextTableNumber();
    const tableName = `Mesa ${nextNum}`;

    const tableGroup = this.createTableGroup(shapeType, tableName);

    this.canvas.add(tableGroup);
    this.canvas.setActiveObject(tableGroup);
    this.canvas.renderAll();
  }

  public toggleMapLock(): void {
    const locked = !this.isLocked();
    this.isLocked.set(locked);

    this.canvas.getObjects().forEach(obj => {
      obj.set({
        lockMovementX: locked, lockMovementY: locked,
        lockRotation: locked, lockScalingX: locked, lockScalingY: locked,
        hasControls: !locked, hasBorders: !locked,
        hoverCursor: locked ? 'pointer' : 'move'
      });
    });

    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  private createTableGroup(type: 'rect' | 'circle', name: string): Group {
    const shape = this.createBaseShape(type);
    const label = this.createLabel(name);

    const group = new Group([shape, label], {
      left: 100,
      top: 100,
      originX: 'center',
      originY: 'center'
    });

    (group as any).data = {
      id: `table_${Date.now()}`,
      nombre: name,
      estado: TableStatus.Available,
      customer_name: '',
      customer_phone: '',
      turno: ''
    };

    return group;
  }

  private createBaseShape(type: 'rect' | 'circle'): FabricObject {
    const config = {
      fill: STATUS_COLORS[TableStatus.Available],
      originX: 'center' as TOriginX,
      originY: 'center' as TOriginY,
    };

    return type === 'rect'
      ? new Rect({ ...config, width: 100, height: 70, rx: 10, ry: 10 })
      : new Circle({ ...config, radius: 45 });
  }

  private createLabel(text: string): IText {
    return new IText(text, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 16,
      fill: '#ffffff',
      fontWeight: '600',
      originX: 'center',
      originY: 'center',
      paintFirst: 'stroke',
      stroke: '#000000',
      strokeWidth: 0.6,
      evented: false
    });
  }

  private attachCanvasEvents(): void {
    this.canvas.on('object:moving', (e) => this.snapToGrid(e.target));
    this.canvas.on('object:modified', (e) => {
      if (e.target instanceof Group) this.checkForTableCollision(e.target);
    });
    this.canvas.on('selection:created', (e) => this.handleTableClick(e));
  }

  private snapToGrid(target: any): void {
    if (!target) return;
    target.set({
      left: Math.round(target.left / GRID_SIZE) * GRID_SIZE,
      top: Math.round(target.top / GRID_SIZE) * GRID_SIZE
    });
    target.setCoords();
  }

  private handleTableClick(event: any): void {
    if (!this.isLocked()) return;

    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();

    if (this.selectedDate() !== getTodayISO()) {
      this.ui.handleError('No se pueden abrir comandas un día que no sea hoy');
      return;
    }

    const selected = event.selected?.[0] as any;
    if (!selected?.data?.id) return;

    const tableId = selected.data.id;
    const tableName = selected.data.nombre || selected.data.name || `Mesa ${tableId}`;
    const tableMetadata = selected.data;

    this.orderService.navigateToTable(tableId, tableName, tableMetadata);
    this.applyStatusVisuals(selected, TableStatus.Occupied);
  }

  public saveFloorPlan(showAlert = true): void {
    const layout = this.canvas.toObject(['data']);
    this.tablesService.saveDailyPlan(this.areaName(), layout, this.selectedDate()).subscribe({
      next: () => showAlert && alert('Mapa guardado'),
      error: (err) => console.error('Save error:', err)
    });
  }

  private loadFloorPlan(): void {
    this.tablesService.getFloorPlanByDate(this.selectedDate()).subscribe(res => {
      if (!res?.layout_data) {
        console.warn('⚠️ No se encontraron datos de distribución para la fecha seleccionada.');
        return;
      }

      const data = typeof res.layout_data === 'string'
        ? JSON.parse(res.layout_data)
        : res.layout_data;

      // Renderizado en el lienzo de Fabric
      this.canvas.loadFromJSON(data).then(() => {
        this.canvas.getObjects().forEach(obj => {
          this.applyLockStateToObj(obj as FabricObject);
        });
        this.syncTableColors();
      });
    });
  }

  private applyLockStateToObj(obj: FabricObject): void {
    const locked = this.isLocked();
    obj.set({ lockMovementX: locked, lockMovementY: locked, hasControls: !locked, selectable: true });
    obj.setCoords();
  }

  private updateTableStatusVisuals(tableId: string, status: TableStatus): void {
    const table = this.canvas.getObjects().find(o => (o as any).data?.id === tableId);
    if (table instanceof Group) this.applyStatusVisuals(table, status);
  }

  private applyStatusVisuals(group: Group, status: string): void {
    const statusColor = STATUS_COLORS[status] || STATUS_COLORS[TableStatus.Available];

    if (!(group as any).data) (group as any).data = {};
    (group as any).data.estado = status;

    group.set({ objectCaching: false, dirty: true });

    group.getObjects().forEach(obj => {
      const isText = obj instanceof IText || obj.type === 'i-text' || obj.type === 'text';

      if (isText) {
        obj.set({
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 0.5,
          paintFirst: 'stroke'
        });
      } else {
        obj.set({ fill: statusColor });
      }
      obj.set('dirty', true);
    });

    this.canvas?.requestRenderAll();
  }

  private syncTableColors(): void {
    if (!this.canvas) return;

    const fechaMapa = this.selectedDate();
    const esHoy = fechaMapa === getTodayISO();

    const activeOrders = esHoy ? this.orderService.allActiveOrders() : [];
    const occupiedTableIds = activeOrders.map(o => String(o.table_id));

    // Tomamos una instantánea (suscripción atómica) para evitar bucles asíncronos cruzados
    this.reservationService.getReservations().subscribe({
      next: (todasLasReservas) => {
        const reservasActivasDelDia = todasLasReservas.filter(res =>
          res.date === fechaMapa && res.status !== 'cancelled'
        );

        let huboMutacionVisual = false;

        this.canvas.getObjects().forEach(obj => {
          if (obj instanceof Group) {
            const data = (obj as any).data;
            if (!data?.id) return;

            const tableId = String(data.id);
            const isOccupied = occupiedTableIds.includes(tableId);

            let targetStatus: string;
            let nuevoNombre = '';
            let nuevoTelefono = '';
            let nuevoTurno = '';

            if (isOccupied) {
              targetStatus = TableStatus.Occupied;
            } else {
              // 🌟 REGLA TRIPLE: Si se hizo clearOrder (el name viene limpio de origen), forzamos libre
              if (!data.customer_name || String(data.customer_name).trim() === '') {
                targetStatus = TableStatus.Available;
              } else {
                // 🌟 REGLA BIDIRECCIONAL (De 1 a 2 y de 2 a 1 reservas dinámicamente)
                const reservasDeEstaMesa = reservasActivasDelDia.filter(r =>
                  r.table_id ? String(r.table_id).trim() === tableId : false
                );

                const totalReservas = reservasDeEstaMesa.length;

                if (totalReservas === 0) {
                  targetStatus = TableStatus.Available;
                }
                else if (totalReservas === 1) {
                  const unicaReserva = reservasDeEstaMesa[0];
                  targetStatus = TableStatus.Reserved;
                  nuevoNombre = unicaReserva.name || '';
                  nuevoTelefono = unicaReserva.phone || '';
                  nuevoTurno = unicaReserva.hour || '';
                }
                else {
                  targetStatus = 'double_reserved';
                  nuevoNombre = reservasDeEstaMesa.map(r => r.name).join(' / ');
                  nuevoTelefono = reservasDeEstaMesa.map(r => r.phone).join(' / ');
                  nuevoTurno = reservasDeEstaMesa.map(r => r.hour).join(' / ');
                }
              }
            }

            // 🌟 ANTI-LOOP DEFENSIVO: Solo alteramos metadatos si el valor real difiere del actual
            if (data.estado !== targetStatus || (nuevoNombre && data.customer_name !== nuevoNombre)) {
              data.estado = targetStatus;
              data.customer_name = nuevoNombre;
              data.customer_phone = nuevoTelefono;
              data.turno = nuevoTurno;
              huboMutacionVisual = true;
            }

            this.applyStatusVisuals(obj, targetStatus);
          }
        });

        if (huboMutacionVisual) {
          this.canvas.requestRenderAll();
        }
      },
      error: (err) => console.error('Error al sincronizar estados con el servidor de reservas:', err)
    });
  }

  private resizeCanvas(): void {
    if (!this.container?.nativeElement || !this.canvas) return;

    const el = this.container.nativeElement;
    const width = el.clientWidth;
    const height = el.clientHeight;

    if (width === 0 || height === 0) return;

    this.canvas.setDimensions({ width, height });
    this.canvas.requestRenderAll();
  }

  public deleteSelected = () => {
    this.canvas.getActiveObjects().forEach(o => this.canvas.remove(o));
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  public rotateSelected = () => {
    const obj = this.canvas.getActiveObject();
    if (obj) obj.set({ angle: (obj.angle + 90) % 360 }).setCoords();
    this.canvas.renderAll();
  }

  public async duplicateSelected(): Promise<void> {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    this.canvas.discardActiveObject();

    for (const obj of activeObjects) {
      const cloned = await obj.clone(['data']);
      const nextNum = this.getNextTableNumber();
      const newName = `Mesa ${nextNum}`;
      (cloned as any).data = {
        ...(cloned as any).data,
        id: `table_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        nombre: newName,
        estado: TableStatus.Available,
        customer_name: '',
        customer_phone: '',
        turno: '',
        notes: ''
      };

      if (cloned instanceof Group) {
        const textObj = cloned.getObjects().find((o) => o instanceof IText) as IText;
        if (textObj) textObj.set('text', newName);
      }

      cloned.set({
        left: (obj.left || 0) + GRID_SIZE * 2,
        top: (obj.top || 0) + GRID_SIZE * 2,
        evented: true,
      });

      this.canvas.add(cloned);
    }

    this.canvas.requestRenderAll();
  }

  private async checkForTableCollision(target: Group): Promise<void> {
    const objects = this.canvas.getObjects();

    const collisionTarget = objects.find(obj =>
      obj !== target &&
      obj instanceof Group &&
      target.intersectsWithObject(obj)
    ) as Group | undefined;

    if (!collisionTarget) return;

    const dataMoving = (target as any).data || {};
    const dataStatic = (collisionTarget as any).data || {};

    const numMoving = parseInt(dataMoving.nombre?.match(/\d+/)?.[0] || '999');
    const numStatic = parseInt(dataStatic.nombre?.match(/\d+/)?.[0] || '999');

    const winnerId = Math.min(numMoving, numStatic);
    const winnerName = `Mesa ${winnerId}`;
    const winnerBaseData = numMoving <= numStatic ? dataMoving : dataStatic;

    const shapes1 = await this.extractPersistentShapes(target);
    const shapes2 = await this.extractPersistentShapes(collisionTarget);

    this.canvas.remove(target, collisionTarget);
    const allShapes = [...shapes1, ...shapes2];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allShapes.forEach(shape => {
      const rect = shape.getBoundingRect();
      if (rect.left < minX) minX = rect.left;
      if (rect.top < minY) minY = rect.top;
      if (rect.left + rect.width > maxX) maxX = rect.left + rect.width;
      if (rect.top + rect.height > maxY) maxY = rect.top + rect.height;
    });

    const groupCenterX = Math.round(((minX + maxX) / 2) / GRID_SIZE) * GRID_SIZE;
    const groupCenterY = Math.round(((minY + maxY) / 2) / GRID_SIZE) * GRID_SIZE;

    allShapes.forEach(shape => {
      shape.set({
        left: shape.left! - groupCenterX,
        top: shape.top! - groupCenterY,
      });
      shape.setCoords();
    });

    const newLabel = this.createLabel(winnerName);

    const mergedGroup = new Group([...allShapes, newLabel], {
      left: groupCenterX,
      top: groupCenterY,
      originX: 'center',
      originY: 'center',
      hasControls: true,
      hasBorders: true
    });

    (mergedGroup as any).data = {
      ...winnerBaseData,
      id: `fused_${Date.now()}`,
      nombre: winnerName,
      isFused: true
    };

    this.canvas.add(mergedGroup);
    mergedGroup.setCoords();
    this.canvas.setActiveObject(mergedGroup);
    this.canvas.requestRenderAll();
  }

  private async extractPersistentShapes(group: Group): Promise<FabricObject[]> {
    const geometries = group.getObjects().filter(o =>
      o instanceof Rect || o instanceof Circle || o.type === 'rect' || o.type === 'circle'
    );

    return Promise.all(geometries.map(async (obj) => {
      const cloned = await obj.clone();
      const matrix = obj.calcTransformMatrix();
      const transform = util.qrDecompose(matrix);

      cloned.set({
        left: transform.translateX,
        top: transform.translateY,
        angle: transform.angle,
        scaleX: transform.scaleX,
        scaleY: transform.scaleY,
        originX: 'center',
        originY: 'center'
      });

      cloned.setCoords();
      return cloned;
    }));
  }

  public onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.selectedDate.set(input.value);
      this.loadFloorPlan();
    }
  }

  public saveAsTemplate(): void {
    this.canvas.getObjects().forEach(obj => obj.setCoords());
    const layout = this.canvas.toObject(['data']);

    this.tablesService.saveTemplatePlan(this.areaName(), layout).subscribe({
      next: () => alert('Plantilla base actualizada correctamente.'),
      error: (err) => console.error('Error al guardar plantilla:', err)
    });
  }

  private getNextTableNumber(): number {
    const objects = this.canvas.getObjects();

    const existingNumbers = objects
      .map(obj => {
        const data = (obj as any).data;
        if (!data) return null;

        const label = data.nombre || data.name;
        if (!label) return null;

        const match = label.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    let next = 1;
    for (const num of existingNumbers) {
      if (num === next) next++;
      else if (num > next) break;
    }

    return next;
  }
}
