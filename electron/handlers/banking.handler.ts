import { ipcMain } from 'electron';
import { DataSource } from 'typeorm';
import { CuentaBancaria } from '../../src/app/database/entities/financiero/cuenta-bancaria.entity';
import { MaquinaPos } from '../../src/app/database/entities/financiero/maquina-pos.entity';
import { AcreditacionPos } from '../../src/app/database/entities/financiero/acreditacion-pos.entity';
import { AcreditacionPosEstado } from '../../src/app/database/entities/financiero/banking-enums';
import { setEntityUserTracking } from '../utils/entity.utils';
import { Usuario } from '../../src/app/database/entities/personas/usuario.entity';

// Procesa acreditaciones pendientes vencidas (sin pasar por IPC).
// Usado por: scheduler en main process, lazy-on-access desde el handler IPC.
export async function procesarAcreditacionesPendientes(dataSource: DataSource): Promise<{ procesadas: number }> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const repo = queryRunner.manager.getRepository(AcreditacionPos);
    const cbRepo = queryRunner.manager.getRepository(CuentaBancaria);
    const ahora = new Date();

    const pendientes = await repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.cuentaBancaria', 'cb')
      .where('a.estado = :estado', { estado: AcreditacionPosEstado.PENDIENTE })
      .andWhere('a.fechaEsperadaAcreditacion <= :ahora', { ahora })
      .getMany();

    let procesadas = 0;
    for (const acred of pendientes) {
      const cb = await cbRepo.findOne({ where: { id: acred.cuentaBancaria.id } });
      if (!cb) continue;
      cb.saldo = Number(cb.saldo) + Number(acred.montoEsperado);
      await queryRunner.manager.save(CuentaBancaria, cb);

      acred.estado = AcreditacionPosEstado.ACREDITADO_AUTO;
      acred.fechaAcreditacionReal = new Date();
      acred.montoAcreditado = Number(acred.montoEsperado);
      await queryRunner.manager.save(AcreditacionPos, acred);
      procesadas++;
    }

    await queryRunner.commitTransaction();
    return { procesadas };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// Inicia un scheduler que procesa acreditaciones cada N minutos.
// Devuelve el handle para poder cancelarlo si hace falta.
export function startAcreditacionesScheduler(dataSource: DataSource, intervalMinutos = 5): NodeJS.Timeout {
  const ms = Math.max(1, intervalMinutos) * 60_000;
  // Disparo inicial al arrancar (no bloqueante)
  procesarAcreditacionesPendientes(dataSource)
    .then(r => {
      if (r.procesadas > 0) {
        console.log(`[Acreditaciones scheduler] inicial: ${r.procesadas} procesadas`);
      }
    })
    .catch(e => console.error('[Acreditaciones scheduler] error inicial:', e));

  return setInterval(() => {
    procesarAcreditacionesPendientes(dataSource)
      .then(r => {
        if (r.procesadas > 0) {
          console.log(`[Acreditaciones scheduler] tick: ${r.procesadas} procesadas`);
        }
      })
      .catch(e => console.error('[Acreditaciones scheduler] error tick:', e));
  }, ms);
}

export function registerBankingHandlers(
  dataSource: DataSource,
  getCurrentUser: () => Usuario | null,
) {
  // ===================== CUENTAS BANCARIAS =====================

  ipcMain.handle('get-cuentas-bancarias', async () => {
    try {
      const repo = dataSource.getRepository(CuentaBancaria);
      return await repo.find({
        relations: ['moneda'],
        order: { nombre: 'ASC' },
      });
    } catch (error) {
      console.error('Error getting cuentas bancarias:', error);
      throw error;
    }
  });

  ipcMain.handle('get-cuenta-bancaria', async (_event, id: number) => {
    try {
      const repo = dataSource.getRepository(CuentaBancaria);
      return await repo.findOne({ where: { id }, relations: ['moneda'] });
    } catch (error) {
      console.error(`Error getting cuenta bancaria ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('create-cuenta-bancaria', async (_event, data: any) => {
    try {
      const repo = dataSource.getRepository(CuentaBancaria);
      const entity = repo.create({
        ...data,
        nombre: data.nombre?.toUpperCase(),
        banco: data.banco?.toUpperCase(),
        numeroCuenta: data.numeroCuenta?.toUpperCase(),
        titular: data.titular?.toUpperCase(),
        alias: data.alias?.toUpperCase(),
      });
      await setEntityUserTracking(dataSource, entity, getCurrentUser()?.id, false);
      const result = await repo.save(entity);
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error('Error creating cuenta bancaria:', error);
      throw error;
    }
  });

  ipcMain.handle('update-cuenta-bancaria', async (_event, id: number, data: any) => {
    try {
      const repo = dataSource.getRepository(CuentaBancaria);
      const existing = await repo.findOne({ where: { id } });
      if (!existing) throw new Error(`CuentaBancaria ${id} no encontrada`);

      const updateData = { ...data };
      if (data.nombre) updateData.nombre = data.nombre.toUpperCase();
      if (data.banco) updateData.banco = data.banco.toUpperCase();
      if (data.numeroCuenta) updateData.numeroCuenta = data.numeroCuenta.toUpperCase();
      if (data.titular) updateData.titular = data.titular.toUpperCase();
      if (data.alias) updateData.alias = data.alias.toUpperCase();

      Object.assign(existing, updateData);
      await setEntityUserTracking(dataSource, existing, getCurrentUser()?.id, true);
      return await repo.save(existing);
    } catch (error) {
      console.error(`Error updating cuenta bancaria ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('delete-cuenta-bancaria', async (_event, id: number) => {
    try {
      const repo = dataSource.getRepository(CuentaBancaria);
      const existing = await repo.findOne({ where: { id } });
      if (!existing) throw new Error(`CuentaBancaria ${id} no encontrada`);
      existing.activo = false;
      await setEntityUserTracking(dataSource, existing, getCurrentUser()?.id, true);
      await repo.save(existing);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting cuenta bancaria ${id}:`, error);
      throw error;
    }
  });

  // ===================== MAQUINAS POS =====================

  ipcMain.handle('get-maquinas-pos', async () => {
    try {
      const repo = dataSource.getRepository(MaquinaPos);
      return await repo.find({
        relations: ['cuentaBancaria', 'cuentaBancaria.moneda'],
        order: { nombre: 'ASC' },
      });
    } catch (error) {
      console.error('Error getting maquinas pos:', error);
      throw error;
    }
  });

  ipcMain.handle('get-maquina-pos', async (_event, id: number) => {
    try {
      const repo = dataSource.getRepository(MaquinaPos);
      return await repo.findOne({
        where: { id },
        relations: ['cuentaBancaria', 'cuentaBancaria.moneda'],
      });
    } catch (error) {
      console.error(`Error getting maquina pos ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('create-maquina-pos', async (_event, data: any) => {
    try {
      const repo = dataSource.getRepository(MaquinaPos);
      const entity = repo.create({
        ...data,
        nombre: data.nombre?.toUpperCase(),
        proveedor: data.proveedor?.toUpperCase(),
      });
      await setEntityUserTracking(dataSource, entity, getCurrentUser()?.id, false);
      const result = await repo.save(entity);
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error('Error creating maquina pos:', error);
      throw error;
    }
  });

  ipcMain.handle('update-maquina-pos', async (_event, id: number, data: any) => {
    try {
      const repo = dataSource.getRepository(MaquinaPos);
      const existing = await repo.findOne({ where: { id } });
      if (!existing) throw new Error(`MaquinaPos ${id} no encontrada`);

      const updateData = { ...data };
      if (data.nombre) updateData.nombre = data.nombre.toUpperCase();
      if (data.proveedor) updateData.proveedor = data.proveedor.toUpperCase();

      Object.assign(existing, updateData);
      await setEntityUserTracking(dataSource, existing, getCurrentUser()?.id, true);
      return await repo.save(existing);
    } catch (error) {
      console.error(`Error updating maquina pos ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('delete-maquina-pos', async (_event, id: number) => {
    try {
      const repo = dataSource.getRepository(MaquinaPos);
      const existing = await repo.findOne({ where: { id } });
      if (!existing) throw new Error(`MaquinaPos ${id} no encontrada`);
      existing.activo = false;
      await setEntityUserTracking(dataSource, existing, getCurrentUser()?.id, true);
      await repo.save(existing);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting maquina pos ${id}:`, error);
      throw error;
    }
  });

  // ===================== ACREDITACIONES POS =====================

  ipcMain.handle('get-acreditaciones-pos', async (_event, filtros?: any) => {
    try {
      const repo = dataSource.getRepository(AcreditacionPos);
      const qb = repo.createQueryBuilder('a')
        .leftJoinAndSelect('a.maquinaPos', 'maquinaPos')
        .leftJoinAndSelect('a.cuentaBancaria', 'cuentaBancaria')
        .leftJoinAndSelect('cuentaBancaria.moneda', 'moneda')
        .leftJoinAndSelect('a.verificadoPor', 'verificadoPor')
        .orderBy('a.fechaTransaccion', 'DESC');

      if (filtros?.estado) {
        qb.andWhere('a.estado = :estado', { estado: filtros.estado });
      }
      if (filtros?.maquinaPosId) {
        qb.andWhere('a.maquina_pos_id = :mp', { mp: filtros.maquinaPosId });
      }
      if (filtros?.cuentaBancariaId) {
        qb.andWhere('a.cuenta_bancaria_id = :cb', { cb: filtros.cuentaBancariaId });
      }
      if (filtros?.fechaDesde) {
        qb.andWhere('a.fechaTransaccion >= :fd', { fd: filtros.fechaDesde });
      }
      if (filtros?.fechaHasta) {
        qb.andWhere('a.fechaTransaccion <= :fh', { fh: filtros.fechaHasta });
      }

      if (filtros?.pageSize != null) {
        const pageSize = Number(filtros.pageSize) || 15;
        const page = Math.max(0, Number(filtros.page) || 0);
        qb.skip(page * pageSize).take(pageSize);
        const [items, total] = await qb.getManyAndCount();
        return { items, total };
      }

      return await qb.getMany();
    } catch (error) {
      console.error('Error getting acreditaciones pos:', error);
      throw error;
    }
  });

  ipcMain.handle('get-acreditacion-pos', async (_event, id: number) => {
    try {
      const repo = dataSource.getRepository(AcreditacionPos);
      return await repo.findOne({
        where: { id },
        relations: ['maquinaPos', 'cuentaBancaria', 'cuentaBancaria.moneda', 'verificadoPor'],
      });
    } catch (error) {
      console.error(`Error getting acreditacion pos ${id}:`, error);
      throw error;
    }
  });

  // Crea acreditacion (uso interno o desde flujo de cobro)
  // No actualiza saldo bancario hasta que sea acreditada (auto o verificada)
  ipcMain.handle('create-acreditacion-pos', async (_event, data: any) => {
    try {
      const repo = dataSource.getRepository(AcreditacionPos);
      const maquinaRepo = dataSource.getRepository(MaquinaPos);

      const maquinaPosId = data.maquinaPos?.id || data.maquinaPosId;
      const maquina = await maquinaRepo.findOne({
        where: { id: maquinaPosId },
        relations: ['cuentaBancaria'],
      });
      if (!maquina) throw new Error(`MaquinaPos ${maquinaPosId} no encontrada`);

      const montoOriginal = Number(data.montoOriginal);
      const porcComision = Number(maquina.porcentajeComision || 0);
      const montoComision = +(montoOriginal * (porcComision / 100)).toFixed(2);
      const montoEsperado = +(montoOriginal - montoComision).toFixed(2);

      const fechaTransaccion = data.fechaTransaccion ? new Date(data.fechaTransaccion) : new Date();
      const fechaEsperada = new Date(fechaTransaccion);
      fechaEsperada.setMinutes(fechaEsperada.getMinutes() + (maquina.minutosAcreditacion || 0));

      const entity = repo.create({
        maquinaPos: { id: maquinaPosId } as any,
        cuentaBancaria: { id: maquina.cuentaBancaria?.id } as any,
        montoOriginal,
        montoComision,
        montoEsperado,
        fechaTransaccion,
        fechaEsperadaAcreditacion: fechaEsperada,
        estado: AcreditacionPosEstado.PENDIENTE,
        ventaId: data.ventaId || null,
      });
      await setEntityUserTracking(dataSource, entity, getCurrentUser()?.id, false);
      const result = await repo.save(entity);
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error('Error creating acreditacion pos:', error);
      throw error;
    }
  });

  // Procesa acreditaciones pendientes vencidas (manual / lazy on access)
  ipcMain.handle('procesar-acreditaciones-auto', async () => {
    try {
      return await procesarAcreditacionesPendientes(dataSource);
    } catch (error) {
      console.error('Error procesando acreditaciones auto:', error);
      throw error;
    }
  });

  // Verificar manualmente: usuario ingresa montoAcreditado real.
  // Si difiere del esperado → CON_DIFERENCIA y se ajusta saldo bancario.
  // Si coincide → VERIFICADO y se suma saldo (si aun no estaba acreditado).
  ipcMain.handle('verificar-acreditacion-pos', async (_event, id: number, montoAcreditado: number) => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const repo = queryRunner.manager.getRepository(AcreditacionPos);
      const cbRepo = queryRunner.manager.getRepository(CuentaBancaria);

      const acred = await repo.findOne({
        where: { id },
        relations: ['cuentaBancaria'],
      });
      if (!acred) throw new Error(`AcreditacionPos ${id} no encontrada`);

      const cb = await cbRepo.findOne({ where: { id: acred.cuentaBancaria.id } });
      if (!cb) throw new Error('Cuenta bancaria no encontrada');

      const montoEsperado = Number(acred.montoEsperado);
      const montoReal = Number(montoAcreditado);
      const diferencia = +(montoReal - montoEsperado).toFixed(2);

      // Estado previo
      const yaAcreditadoAuto = acred.estado === AcreditacionPosEstado.ACREDITADO_AUTO;

      if (yaAcreditadoAuto) {
        // Ya se sumo montoEsperado al saldo. Ajustar por la diferencia (puede ser + o -)
        if (diferencia !== 0) {
          cb.saldo = Number(cb.saldo) + diferencia;
          await queryRunner.manager.save(CuentaBancaria, cb);
        }
      } else {
        // Aun no acreditada: sumar el monto real al saldo
        cb.saldo = Number(cb.saldo) + montoReal;
        await queryRunner.manager.save(CuentaBancaria, cb);
      }

      acred.montoAcreditado = montoReal;
      acred.diferencia = diferencia;
      acred.estado = diferencia === 0
        ? AcreditacionPosEstado.VERIFICADO
        : AcreditacionPosEstado.CON_DIFERENCIA;
      acred.fechaAcreditacionReal = acred.fechaAcreditacionReal || new Date();
      acred.fechaVerificacion = new Date();
      const currentUser = getCurrentUser();
      if (currentUser) {
        acred.verificadoPor = currentUser;
      }
      await setEntityUserTracking(dataSource, acred, currentUser?.id, true);
      await queryRunner.manager.save(AcreditacionPos, acred);

      await queryRunner.commitTransaction();
      return acred;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`Error verificando acreditacion ${id}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  });

  // Acreditar transferencia bancaria: suma instantanea al saldo de la cuenta.
  // Usado en el flujo de cobro cuando la formaPago es transferencia/PIX.
  // No tiene comision, no genera AcreditacionPos.
  ipcMain.handle('acreditar-transferencia-bancaria', async (_event, payload: any) => {
    try {
      const cuentaBancariaId = payload.cuentaBancariaId;
      const monto = Number(payload.monto);
      if (!cuentaBancariaId || monto <= 0) {
        throw new Error('Datos invalidos');
      }
      const repo = dataSource.getRepository(CuentaBancaria);
      const cb = await repo.findOne({ where: { id: cuentaBancariaId } });
      if (!cb) throw new Error(`CuentaBancaria ${cuentaBancariaId} no encontrada`);
      cb.saldo = Number(cb.saldo) + monto;
      await repo.save(cb);
      return { success: true, saldoActual: Number(cb.saldo) };
    } catch (error) {
      console.error('Error acreditando transferencia bancaria:', error);
      throw error;
    }
  });

  // Obtener pendientes (atajo)
  ipcMain.handle('get-acreditaciones-pendientes', async () => {
    try {
      const repo = dataSource.getRepository(AcreditacionPos);
      return await repo.find({
        where: [
          { estado: AcreditacionPosEstado.PENDIENTE },
          { estado: AcreditacionPosEstado.ACREDITADO_AUTO },
        ],
        relations: ['maquinaPos', 'cuentaBancaria', 'cuentaBancaria.moneda'],
        order: { fechaTransaccion: 'DESC' },
      });
    } catch (error) {
      console.error('Error getting acreditaciones pendientes:', error);
      throw error;
    }
  });
}
