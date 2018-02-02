/*!
Copyright 2016-2018 Brazil Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { Observable, Subscription } from 'rxjs';

import { StorageService } from '../shared/storage.service';
import { WindowService } from '../shared/window.service';
import { ProgramsService, SearchOptions } from './programs.service';
import { CommentService } from '../comment/comment.service';
import { CommentPlayer } from '../comment/comment-player.service';
import { Player, VlcState } from '../player/player.service';

@Component({
  selector: 'program-play',
  templateUrl: 'program-play.component.html',
})
export class ProgramPlayComponent implements OnInit, OnDestroy {
  public active: boolean = false;
  public id: string;
  public type: string;
  public channel: string;
  public start: number;
  public end: number;
  public info: any;
  public programs: any[] = [];
  public commentInfo: any;
  public intervals: any[] = [];
  public chapters: number[] = [];
  public chartPoints: string = '';
  public sidebarCollapsed: boolean = false;
  public offset: Date;
  private subscriptions: Subscription[] = [];

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private viewContainerRef: ViewContainerRef,
    private hotkeysService: HotkeysService,
    private toastsManager: ToastsManager,
    private storageService: StorageService,
    private windowService: WindowService,
    private commentService: CommentService,
    private commentPlayer: CommentPlayer,
    private programsService: ProgramsService,
    public player: Player,
  ) { }

  get isFullscreen() {
    return this.windowService.fullscreen;
  }

  get isAlwaysOnTop() {
    return this.windowService.alwaysOnTop;
  }

  get commentEnabled() {
    return this.commentPlayer.enabled;
  }

  set commentDelay(delay: number) {
    this.commentPlayer.delay = delay;
    const delaySeconds: number = Math.round(this.commentPlayer.delay / 100) / 10;
    const message: string = `コメント遅延 ${delaySeconds}秒`;
    this.player.screenText.next({ message });
  }

  get commentDelay() {
    return this.commentPlayer.delay;
  }

  ngOnInit() {
    this.initHotkeys();
    this.toastsManager.setRootViewContainerRef(this.viewContainerRef);
    this.windowService.powerSave = false;
    this.sidebarCollapsed = Boolean(this.storageService.loadLocalStorage('sidebarCollapsed'));

    this.subscriptions.push(
      this.route.queryParams.subscribe((params: any) => {
        if (this.active) {
          if (
            params.id !== params.id ||
            params.start !== this.start ||
            params.end !== this.end ||
            params.channel !== this.channel ||
            params.type !== this.type
          ) {
            this.type = params.type;
            this.channel = params.channel;
            this.start = parseInt(params.start, 10);
            this.end = parseInt(params.end, 10);
            this.load();
          }
        } else {
          this.id = params.id;
          this.type = params.type;
          this.channel = params.channel;
          this.start = parseInt(params.start, 10);
          this.end = parseInt(params.end, 10);
        }
      }),
      this.player.event.filter((event: any): boolean => (
        event.name === 'PositionChanged'
      )).subscribe(() => {
        this.commentPlayer.seek(this.player.time);
      }),
      this.player.event.filter((event: any): boolean => (
        event.name === 'Stopped'
      )).subscribe(() => {
        this.location.back();
      }),
      this.player.event.filter((event: any): boolean => (
        event.name === 'EncounteredError'
      )).subscribe(() => {
        this.toastsManager.error(
          'vlc has encountered an error and is unable to continue.',
          'Player error',
        );
      }),
      this.player.event.filter((event: any): boolean => (
        event.name === 'EndReached'
      )).subscribe(() => {
        this.next();
      }),
      this.commentPlayer.count.subscribe((count: number) => {
        const query: string = (
          this.commentService.loadQuery(this.commentPlayer.channel) || ''
        ).split('||').join(',');
        const start: Date = this.commentPlayer.offset;
        const end: Date = new Date(this.commentPlayer.offset.getTime() + this.player.length);
        this.commentInfo = {
          query,
          start,
          end,
          count,
        };
      }),
      this.commentPlayer.intervals.subscribe((intervals: any[]) => {
        this.intervals = intervals;
        this.updateChart();
      }),
      this.commentPlayer.valueChanges.subscribe((data: any) => {
        const delay: number = data.delay;
        if (delay != null && !isNaN(delay)) {
          this.offset = new Date(this.info.start);
          this.updateChart();
          this.updateChapters();
        }
      }),
    );

    if (this.programsService.isReady) {
      this.setup();
    } else {
      this.init();
    }
  }

  public ngOnDestroy() {
    this.windowService.powerSave = true;
    this.subscriptions.forEach((a: Subscription) => {
      a.unsubscribe();
    });
  }

  protected initHotkeys() {
    this.hotkeysService.add([
      new Hotkey(
        's',
        (): boolean => {
          this.stop();
          return false;
        },
        [],
        '再生を終了',
      ),
      new Hotkey(
        'space',
        (): boolean => {
          this.player.togglePause();
          return false;
        },
        [],
        '再生/一時停止',
      ),
      new Hotkey(
        '=',
        (): boolean => {
          this.player.normalSpeed();
          return false;
        },
        [],
        '再生速度を通常に戻す',
      ),
      new Hotkey(
        ['-', 'pagedown'],
        (): boolean => {
          this.player.speedDown();
          return false;
        },
        [],
        '再生速度を下げる',
      ),
      new Hotkey(
        ['+', 'pageup'],
        (): boolean => {
          this.player.speedUp();
          return false;
        },
        [],
        '再生速度を上げる',
      ),
      new Hotkey(
        'b',
        (): boolean => {
          this.player.toggleAudioTrack();
          return false;
        },
        [],
        '音声切り替え',
      ),
      new Hotkey(
        'v',
        (): boolean => {
          this.player.toggleSubtitlesTrack();
          return false;
        },
        [],
        '',
      ),
      new Hotkey(
        'm',
        (): boolean => {
          this.player.toggleMute();
          return false;
        },
        [],
        'ミュート',
      ),
      new Hotkey(
        ['home', 'p'],
        (): boolean => {
          this.previous();
          return false;
        },
        [],
        '前の番組を再生',
      ),
      new Hotkey(
        ['end', 'n'],
        (): boolean => {
          this.next();
          return false;
        },
        [],
        '次の番組を再生',
      ),
      new Hotkey(
        'f',
        (): boolean => {
          this.toggleFullscreen();
          return false;
        },
        [],
        '全画面表示/解除',
      ),
      new Hotkey(
        ['up', 'mod+up'],
        (): boolean => {
          this.player.mute = false;
          this.player.increaseVolume(5);
          return false;
        },
        [],
        '音量を上げる',
      ),
      new Hotkey(
        ['down', 'mod+down'],
        (): boolean => {
          this.player.mute = false;
          this.player.decreaseVolume(5);
          return false;
        },
        [],
        '音量を下げる',
      ),
      new Hotkey(
        ['left', 'mod+left'],
        (): boolean => {
          this.player.jumpBackward('11s');
          return false;
        },
        [],
        '10秒戻す',
      ),
      new Hotkey(
        ['right', 'mod+right'],
        (): boolean => {
          this.player.jumpForward('29s');
          return false;
        },
        [],
        '30秒進める',
      ),
      new Hotkey(
        ['shift+left', '['],
        (): boolean => {
          this.commentPlayer.delay -= 500;
          return false;
        },
        [],
        'コメントを早める',
      ),
      new Hotkey(
        ['shift+right', ']'],
        (): boolean => {
          this.commentPlayer.delay += 500;
          return false;
        },
        [],
        'コメントを遅らせる',
      ),
      new Hotkey(
        ['o', 'mod+s'],
        (): boolean => {
          this.sidebarCollapsed = !this.sidebarCollapsed;
          return false;
        },
        [],
        'サイドバーを表示/非表示',
      ),
    ]);
  }

  public init() {
    this.programsService.init().subscribe(() => {
      this.setup();
    });
  }

  public setup() {
    this.programsService.streamParams = 'c:v=copy&c:a=copy';
    this.active = true;
    this.load();
  }

  public load() {
    if (
      this.type &&
      this.channel
    ) {
      const options: SearchOptions = {
        type: this.type,
        channel: this.channel,
      };
      if (this.end) {
        options.end = this.end - 1;
        options.reverse = true;
      } else if (this.start) {
        options.start = this.start;
        options.reverse = false;
      } else {
        options.reverse = true;
      }
      this.programsService.search(options, false).mergeMap(
        (result: any): Observable<any> => {
          if (result.hits > 0) {
            return Observable.of(result);
          }
          return this.programsService.init().mergeMap((): Observable<any> => (
            this.programsService.search(options, false)
          ));
        },
      ).map(
        (result: any): any => {
          if (result.hits > 0) {
            return this.start ? result.programs.filter((a: any): boolean => (
              a.start.getTime() <= this.start &&
              a.end.getTime() > this.start
            ))[0] : result.programs[0];
          }
          throw result;
        },
      ).mergeMap((result: any): Observable<[any, number, any[]]> => {
        if (result != null && typeof result === 'object') {
          return result.isRecorded.mergeMap((isRecorded: boolean): Observable<any[]> => {
            if (isRecorded) {
              return Observable.zip(
                Observable.of(result),
                result.recordedDuration,
                this.programsService.search(
                  {
                    type: result.type,
                    channel: result.channel,
                    start: result.start.getTime(),
                    end: result.end.getTime() - 1,
                  },
                  true,
                ).map((result: any): any[] => result.programs).catch((): any[] => []),
              );
            }
            return Observable.throw(null);
          });
        }
        return Observable.throw(result);
      }).subscribe(
        (results: [any, number, any[]]) => {
          const [info, duration, programs]: [any, number, any[]] = results;
          this.info = info;
          this.programs = programs;
          this.offset = new Date(info.start);
          this.player.overwriteLength = duration;
          this.player.preseekTime = this.start ? this.start - info.start.getTime() : 0;
          this.player.play(info.stream);
          this.player.pause();
          this.player.screenText.next({
            message: [
              info.id,
              info.fullTitle,
              info.channelName,
            ].join('\n'),
            force: true,
          });
          this.updateChapters();
          this.commentPlayer.init(info.start, info.duration, info.channelName);
        },
        (error: any) => {

          if (
            error == null || (
              typeof error === 'object' &&
              error.hits <= 0
            )
          ) {
            this.toastsManager.warning('録画が見つかりません。', 'Backend error', {
              toastLife: 10000,
              dismiss: 'click',
              newestOnTop: true,
              positionClass: 'toast-top-right',
            });
          } else {
            this.toastsManager.error('番組情報の取得に失敗しました。', 'Backend Error', {
              dismiss: 'click',
              newestOnTop: true,
              positionClass: 'toast-bottom-right',
            });
          }
        },
      );
    }
  }

  protected updateChapters() {
    this.chapters = this.programs.map((a: any): number => {
      const position: number = (a.start.getTime() - this.offset.getTime()) / this.player.length;
      return Math.floor(position * 100000) / 100000;
    });
  }

  protected updateChart() {
    const offset: number = this.commentPlayer.offset.getTime() - 60000;
    const width: number = 100;
    const height: number = 100;
    const points: string[] = [];

    if (this.player.length && Array.isArray(this.intervals)) {
      const max: number = Math.max.apply(null, this.intervals.map((a: any): number => a.n_hits));
      const xscale: number = width / this.player.length;
      const yscale: number = max ? height / max : height;

      points.push(`0,${height}`);
      for (const interval of this.intervals) {
        if (interval.start >= offset) {
          const x: number = (interval.start - offset) * xscale;
          const y: number = height - (interval.n_hits * yscale);
          points.push(`${x},${y}`);
        }
      }
      this.chartPoints = points.join(' ');
    } else {
      this.chartPoints = '';
    }
  }

  public onMouseWheel(e: WheelEvent) {
    if (e.deltaX !== 0) {
      this.player.jumpForward(`${(e.deltaX * 10000) / 120}ms`);
    }
    if (e.deltaY !== 0) {
      this.player.mute = false;
      this.player.decreaseVolume(e.deltaY / 60);
    }
  }

  public onSidebarCollapsed() {
    this.storageService.saveLocalStorage('sidebarCollapsed', true);
  }

  public onSidebarExpanded() {
    this.storageService.saveLocalStorage('sidebarCollapsed', false);
  }

  public toggleFullscreen() {
    this.windowService.fullscreen = !this.windowService.fullscreen;
  }

  public toggleAlwaysOnTop() {
    this.windowService.alwaysOnTop = !this.windowService.alwaysOnTop;
  }

  public toggleComment() {
    this.commentPlayer.enabled = !this.commentPlayer.enabled;
  }

  public stop() {
    if (
      this.player.state === VlcState.NothingSpecial ||
      this.player.state === VlcState.Stopped ||
      this.player.state === VlcState.Ended ||
      this.player.state === VlcState.Error
    ) {
      this.location.back();
    } else {
      this.player.stop();
    }
  }

  public jump(time: number) {
    this.player.time = time;
  }

  public previous() {
    let type: string = '';
    let channel: string = '';
    let end: string = '';
    if (this.info != null && typeof this.info === 'object') {
      if (this.info.type) {
        type = this.info.type;
      }
      if (this.info.channel) {
        channel = this.info.channel;
      }
      if (this.info.start) {
        end = String(new Date(this.info.start).getTime());
      }
    } else {
      if (this.type) {
        type = this.type;
      }
      if (this.channel) {
        channel = this.channel;
      }
      if (this.start) {
        end = String(this.start);
      }
    }
    this.router.navigate([], {
      queryParams: {
        type,
        channel,
        end,
      },
      replaceUrl: true,
    });
  }

  public next() {
    let type: string = '';
    let channel: string = '';
    let start: string = '';
    if (this.info != null && typeof this.info === 'object') {
      if (this.info.type) {
        type = this.info.type;
      }
      if (this.info.channel) {
        channel = this.info.channel;
      }
      if (this.info.end) {
        start = String(new Date(this.info.end).getTime());
      }
    } else {
      if (this.type) {
        type = this.type;
      }
      if (this.channel) {
        channel = this.channel;
      }
      if (this.end) {
        start = String(this.end);
      }
    }
    this.router.navigate([], {
      queryParams: {
        type,
        channel,
        start,
      },
      replaceUrl: true,
    });
  }
}