export function _initCctvPanel() {
  if (!this._cctvPanel) return;

  this.listen(this._cctvEnableBtn, 'click', async () => {
    this._actionGeneration++;
    await this.actions.toggleEnabled();
  });

  this.listen(this._cctvNearestBtn, 'click', async () => {
    const generation = ++this._actionGeneration;
    const activeId = this._cctvState?.activeCameraId;
    if (!(await this.actions.toggleEnabled(true))) return;
    if (
      this.destroyed ||
      generation !== this._actionGeneration ||
      !this.actions.isEnabled() ||
      (activeId && activeId !== this._cctvState?.activeCameraId)
    )
      return;
    this.actions.runExplicitFocus(
      () => this.cctv.focusNearest({ focus: false }),
      (cameraId) => this.cctv.focusCamera(cameraId, 1.8),
    );
  });

  this.listen(this._cctvLiveFilterBtn, 'click', async () => {
    this._liveOnly = !this._liveOnly;
    if (this._liveOnly) {
      const liveCams = (this._cctvState?.cameras || []).filter(
        (c) =>
          c.isVideo ||
          c.feedType === 'hls' ||
          c.feedType === 'mp4' ||
          c.feedType === 'webm',
      );
      const isActiveLive = liveCams.some(
        (c) => c.id === this._cctvState?.activeCameraId,
      );
      if (!isActiveLive && liveCams.length > 0) {
        const firstLiveId = liveCams[0].id;
        await this.actions.toggleEnabled(true);
        this.actions.runExplicitFocus(
          () => (this.cctv.selectCamera(firstLiveId) ? firstLiveId : null),
          (selectedId) => this.cctv.focusCamera(selectedId, 2.2),
        );
      }
    }
    this._renderCctvState(this._cctvState);
  });

  this.listen(this._cctvPrevBtn, 'click', async () => {
    const generation = ++this._actionGeneration;
    const activeId = this._cctvState?.activeCameraId;
    if (!(await this.actions.toggleEnabled(true))) return;
    if (
      this.destroyed ||
      generation !== this._actionGeneration ||
      !this.actions.isEnabled() ||
      (activeId && activeId !== this._cctvState?.activeCameraId)
    )
      return;
    const cyclePrev = () => {
      if (this._liveOnly) {
        const liveCams = (this._cctvState?.cameras || []).filter(
          (c) =>
            c.isVideo ||
            c.feedType === 'hls' ||
            c.feedType === 'mp4' ||
            c.feedType === 'webm',
        );
        if (liveCams.length > 0) {
          const currIdx = liveCams.findIndex(
            (c) => c.id === this._cctvState?.activeCameraId,
          );
          const nextIdx =
            currIdx <= 0 ? liveCams.length - 1 : currIdx - 1;
          const nextId = liveCams[nextIdx].id;
          return this.cctv.selectCamera(nextId) ? nextId : null;
        }
      }
      return this.cctv.cycleCamera(-1);
    };
    this.actions.runExplicitFocus(
      cyclePrev,
      (cameraId) => this.cctv.focusCamera(cameraId, 1.4),
    );
  });

  this.listen(this._cctvNextBtn, 'click', async () => {
    const generation = ++this._actionGeneration;
    const activeId = this._cctvState?.activeCameraId;
    if (!(await this.actions.toggleEnabled(true))) return;
    if (
      this.destroyed ||
      generation !== this._actionGeneration ||
      !this.actions.isEnabled() ||
      (activeId && activeId !== this._cctvState?.activeCameraId)
    )
      return;
    const cycleNext = () => {
      if (this._liveOnly) {
        const liveCams = (this._cctvState?.cameras || []).filter(
          (c) =>
            c.isVideo ||
            c.feedType === 'hls' ||
            c.feedType === 'mp4' ||
            c.feedType === 'webm',
        );
        if (liveCams.length > 0) {
          const currIdx = liveCams.findIndex(
            (c) => c.id === this._cctvState?.activeCameraId,
          );
          const nextIdx =
            currIdx === -1 || currIdx >= liveCams.length - 1 ? 0 : currIdx + 1;
          const nextId = liveCams[nextIdx].id;
          return this.cctv.selectCamera(nextId) ? nextId : null;
        }
      }
      return this.cctv.cycleCamera(1);
    };
    this.actions.runExplicitFocus(
      cycleNext,
      (cameraId) => this.cctv.focusCamera(cameraId, 1.4),
    );
  });

  this.listen(this._cctvSelect, 'change', async () => {
    const generation = ++this._actionGeneration;
    const activeId = this._cctvState?.activeCameraId;
    const cameraId = this._cctvSelect.value;
    if (!cameraId) return;
    if (!(await this.actions.toggleEnabled(true))) return;
    if (
      this.destroyed ||
      generation !== this._actionGeneration ||
      !this.actions.isEnabled() ||
      (activeId && activeId !== this._cctvState?.activeCameraId)
    )
      return;
    // Picking a camera from the dropdown flies to it. The catalog spans
    // three metros, so a bare selection used to leave the view in the old
    // city with a camera active thousands of km away.
    this.actions.runExplicitFocus(
      () => (this.cctv.selectCamera(cameraId) ? cameraId : null),
      (selectedId) => this.cctv.focusCamera(selectedId, 2.2),
    );
    this.actions.setParams({ selectedCameraId: cameraId }, { origin: 'user' });
  });

  this.listen(this._cctvFocusBtn, 'click', async () => {
    const generation = ++this._actionGeneration;
    const activeId = this._cctvState?.activeCameraId;
    const selected = this._cctvState?.activeCameraId || this._cctvSelect?.value;
    if (!selected) return;
    if (!(await this.actions.toggleEnabled(true))) return;
    if (
      this.destroyed ||
      generation !== this._actionGeneration ||
      !this.actions.isEnabled() ||
      (activeId && activeId !== this._cctvState?.activeCameraId)
    )
      return;
    this.actions.runExplicitFocus(
      () => selected,
      (cameraId) => this.cctv.focusCamera(cameraId, 1.9),
    );
    this.actions.setParams({ selectedCameraId: selected }, { origin: 'user' });
  });

  this.listen(this._cctvCoverageBtn, 'click', () => {
    const current =
      this._cctvState?.coverageMode ||
      (this._cctvState?.showCoverage ? 'on' : 'off');
    const next =
      current === 'off' ? 'on' : current === 'on' ? 'viewshed' : 'off';
    this.actions.setParams({ coverageMode: next }, { origin: 'user' });
  });

  this.listen(this._cctvAutoHopBtn, 'click', () => {
    const current = !!this._cctvState?.autoHop;
    this.actions.setParams({ autoHop: !current }, { origin: 'user' });
  });

  this.listen(this._cctvProjectionBtn, 'click', () => {
    const current = this._cctvState?.showProjection !== false;
    this.actions.setParams({ showProjection: !current }, { origin: 'user' });
  });

  this.listen(this._cctvAdjustBtn, 'click', () => {
    const current = !!this._cctvState?.calibrationMode;
    this.actions.setParams({ calibrationMode: !current }, { origin: 'user' });
  });

  // Click-to-edit pose readout: each chip swaps to a number input; Enter or
  // blur commits (converted to a calibration offset against basePose),
  // Escape cancels. Delegated so re-renders never re-bind.
  this.listen(this._cctvCalReadout, 'click', (event) => {
    const chip = event.target.closest?.('.cctv-cal-value');
    if (!chip || chip.disabled || chip.querySelector('input')) return;
    this._beginCctvCalValueEdit(chip);
  });

  this.listen(this._cctvCalibSaveBtn, 'click', () => {
    const cameraId = this._activeCctvCameraId();
    if (!cameraId || !this.actions.setParams) return;
    this.actions.setParams(
      {
        selectedCameraId: cameraId,
        calibration: { cameraId, save: true },
      },
      { origin: 'user' },
    );
    this.actions.showToast('CCTV calibration saved');
  });

  this.listen(this._cctvCalibResetBtn, 'click', () => {
    this._resetCctvCalibration();
  });

  this._renderCctvState(null);
  this.actions.syncViewport();
}
