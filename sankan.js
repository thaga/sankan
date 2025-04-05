let auto_save_enabled = false;
let ptable_active_range = 5;
let display_attr_count = 2;
let on_add_count = 2;

let csv_file_handle = null;

// メンドイので、
// 友達リストのテーブルは ftable (friend table) と書く
// 参加者リストのテーブルは ptable (participant table) と書く
const ftable = document.createElement('table');
const ptable = document.createElement('table');


const create_button = (title, eh) => {
    const button = document.createElement('button');
    button.textContent = title;
    button.addEventListener('click', eh);
    return button;
}

const load_file_button = create_button('友達名簿読み込み', ()=>{load_flist();});
const autosave_div = document.createElement('div');
const range_div = document.createElement('div');
const attrib_div = document.createElement('div');
const join_count_div = document.createElement('div');
const delete_attrib_name_input = document.createElement('input');

// 友達の情報一覧
const flist = [];
const flist_order = [];
const friend_attrib_list = [];

// flistのうち参加待機状態にいるものの情報
const plist = [];

// 扱う名簿のファイル種類
const csv_file_type = {
    types: [{
        description: 'CSV Files',
        accept: {
        'text/csv': ['.csv']
        }
    }]
};

const init = () => {
    // 友達名簿読み込みボタン
    document.body.appendChild(load_file_button);

    // オートセーブ
    set_autosave(auto_save_enabled);
    document.body.appendChild(autosave_div);

    // ファイル操作関連ボタン
    const file_action_div = document.createElement('div');
    file_action_div.appendChild(create_button('名前を付けて名簿を保存', ()=>{saveas_flist();}));
    file_action_div.appendChild(create_button('上書き保存', ()=>{save_flist();}));
    document.body.appendChild(file_action_div);

    //-----------------------------------------------------------------------------
    document.body.appendChild(document.createElement('hr'));
    
    // 友達リスト
    const ftable_title = document.createElement('div');
    ftable_title.textContent = '友達リスト';
    document.body.appendChild(ftable_title);

    document.body.appendChild(ftable);

    // 友達リスト操作関連ボタン
    const ftable_action_div = document.createElement('div');
    ftable_action_div.appendChild(create_button('新規の友達を追加', ()=>{add_new_friend();}));
    ftable_action_div.appendChild(create_button('新規の列を追加', ()=>{add_new_attrib();}));
    ftable_action_div.appendChild(create_button('名前を指定して列を削除', (e)=>{delete_attrib(delete_attrib_name_input.value);}));
    ftable_action_div.appendChild(delete_attrib_name_input);
    document.body.appendChild(ftable_action_div);

    //-----------------------------------------------------------------------------
    document.body.appendChild(document.createElement('hr'));

    // 同時参加できる数の設定
    add_range(0);
    document.body.appendChild(range_div);

    // 参加者テーブルに表示する友達の数
    add_attrib_count(0);
    document.body.appendChild(attrib_div);

    // 参加者テーブルに追加するときに付与するカウント
    add_join_count(0);
    document.body.appendChild(join_count_div);

    // 同時参加者のカウントを一つ減らすボタン
    document.body.appendChild(create_button('参加者のカウントを1減らす', (e)=>{range_dec();}));
    
    // カウントが0以下の参加者を削除するボタン
    document.body.appendChild(create_button('カウントが0以下の参加待機者を削除', (e)=>{delete_0();}));

    // 参加待機リスト
    const ptable_title = document.createElement('div');
    ptable_title.textContent = '参加待機リスト';
    document.body.appendChild(ptable_title);

    document.body.appendChild(ptable);


    // サンプルデータの登録操作
    create_sample();

    
    // 両リストの構築
    build_ptable();
    build_ftable();
};

const build_ptable = () => {
    // 内容クリア
    while (ptable.rows.length > 0) ptable.deleteRow(0);

    // テーブルの内容作成
    for (let y = -1; y < plist.length; ++y) {
        const row = ptable.insertRow();

        if (y >= 0 && y < ptable_active_range) {
            row.style.backgroundColor = 'yellow';
        }

        if (false) {
            for (let x = 0; x < 10; ++x) {
                const cell = row.insertCell();
                const r = ['cell', 'a', 'random', '日本語', 'tekitounanagasa'];
                const t = r[Math.trunc(Math.random() * r.length)];
                cell.appendChild(document.createTextNode(`セル${t}${y}${x}`));
            }
        }

        // 先頭に追加する固定内容
        const move_cell = row.insertCell();
        if (y < 0) {
            move_cell.textContent = '移動';
        } else {
            move_cell.appendChild(create_button('↑', ()=>{swap_plist(y, y-1);}));
            move_cell.appendChild(create_button('↓', ()=>{swap_plist(y, y+1);}));
        }
        const count_cell = row.insertCell();
        if (y < 0) {
            count_cell .textContent = 'カウント';
        } else {
            count_cell.appendChild(create_button('+', ()=>{add_count(y, 1);}));
            count_cell.appendChild(create_button('-', ()=>{add_count(y, -1);}));
            count_cell.appendChild(document.createTextNode(' ' + plist[y].count));
        }
        const pref_cell = row.insertCell();
        if (y < 0) {
            pref_cell.textContent = '優先';
        } else {
            if (plist[y].preferential) pref_cell.textContent =  '〇';
        }

        // 友達内容
        for (x = 0; x < display_attr_count && x < friend_attrib_list.length; ++x) {
            const cell = row.insertCell();
            const attr = friend_attrib_list[x];
            if (y < 0) {
                cell.textContent = attr;
            } else {
                cell.textContent = flist[plist[y].friend_index][attr] || '';
            }
        }

        // 末尾に追加する固定内容
        const del_cell = row.insertCell();
        if (y < 0) {
            del_cell.textContent = '削除';
        } else {
            del_cell.appendChild(create_button('✖', ()=>{delete_plist(y)}));
        }
    }
}

const build_ftable = () => {
    // 内容クリア
    while (ftable.rows.length > 0) ftable.deleteRow(0);

    for (let y = -1; y < flist.length; ++y) {
        const row = ftable.insertRow();

        // 先頭に追加する固定内容
        const add_cell = row.insertCell();
        if (y < 0) {
            add_cell.textContent = '待機追加';
        } else {
            const fi = flist_order[y];
            add_cell.appendChild(create_button('通常', (e)=>{add_plist(fi, false);}));
            add_cell.appendChild(create_button('優先', (e)=>{add_plist(fi, true);}));
        }
        const move_cell = row.insertCell();
        if (y < 0) {
            move_cell.textContent = '移動';
        } else {
            move_cell.appendChild(create_button('↑', ()=>{swap_flist(y, y-1);}));
            move_cell.appendChild(create_button('↓', ()=>{swap_flist(y, y+1);}));
        }

        // 友達内容追加
        for (let x = 0; x < friend_attrib_list.length; ++x) {
            const cell = row.insertCell();
            // 編集可能にしておく
            cell.contentEditable = true;
            cell.spellcheck = false;
            // Enterキーを押したら改行させないで内容確定
            cell.onkeydown = (e)=>{
                if (e.key === 'Enter') {
                    e.target.entered = true;
                    e.target.blur(); // 内容確定（というかフォーカスを外すだけ）
                    return e.preventDefault(); // Enterキーを無効化
                }
            };
            if (y < 0) {
                cell.textContent = friend_attrib_list[x] + ' ';
                const lb = create_button('<', ()=>{cell.moved=true;swap_attrib(x, x-1);});
                const rb = create_button('>', ()=>{cell.moved=true;swap_attrib(x, x+1);});
                cell.appendChild(lb);
                cell.appendChild(rb);
                
                // フォーカスが外れるときに内容を反映
                cell.onblur = (e)=> {
                    if (!e.target.moved) {
                        const value = e.target.textContent.trim();
                        change_attrib(x, value); // 内容更新
                        build_ftable();
                        build_ptable();
                    }
                };
                cell.onclick = (e)=>{
                    // 末尾の' <>'を削除
                    cell.removeChild(lb);
                    cell.removeChild(rb);
                };
            } else {
                const fr = flist[flist_order[y]];
                const attr = friend_attrib_list[x];
                const value = fr[attr] || '';
                cell.textContent = value;

                // フォーカスが外れるときに内容を反映
                cell.onblur = (e)=> {
                    fr[attr] = e.target.textContent; // 内容更新
                    build_ftable();
                    build_ptable();
                    auto_save();
                };
            }
        }

        // 末尾に追加する固定内容
        const del_cell = row.insertCell();
        if (y < 0) {
            del_cell.textContent = '削除';
        } else {
            // const del_button = document.createElement('button');
            // del_button.textContent = '✖';
            // del_cell.appendChild(del_button);
            const fi = flist_order[y];
            del_cell.appendChild(create_button('✖', ()=>{delete_friend(fi)}));
        }
    }
}

const set_autosave = (a) => {

    // 一旦消去
    autosave_div.textContent = '';

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = a;
    check.addEventListener('click', (e)=>{auto_save_enabled = e.target.checked;});

    autosave_div.appendChild(document.createTextNode(`自動セーブ `));
    autosave_div.appendChild(check);
}

const add_range = (n) => {
    ptable_active_range = Math.max(0, ptable_active_range + n);

    // 一旦消去
    range_div.textContent = '';

    range_div.appendChild(document.createTextNode(`同時参加: `));
    range_div.appendChild(create_button('+', ()=>{add_range(1);}));
    range_div.appendChild(create_button('-', ()=>{add_range(-1);}));
    range_div.appendChild(document.createTextNode(` ${ptable_active_range}`));

    build_ptable();
}

const add_attrib_count = (n) => {
    display_attr_count = Math.max(0, display_attr_count + n);

    // 一旦消去
    attrib_div.textContent = '';

    attrib_div.appendChild(document.createTextNode(`表示属性数: `));
    attrib_div.appendChild(create_button('+', ()=>{add_attrib_count(1);}));
    attrib_div.appendChild(create_button('-', ()=>{add_attrib_count(-1);}));
    attrib_div.appendChild(document.createTextNode(` ${display_attr_count}`));

    build_ptable();
}

const add_join_count = (n) => {
    on_add_count = Math.max(0, on_add_count + n);

    // 一旦消去
    join_count_div.textContent = '';

    join_count_div.appendChild(document.createTextNode(`追加時付与カウント: `));
    join_count_div.appendChild(create_button('+', ()=>{add_join_count(1);}));
    join_count_div.appendChild(create_button('-', ()=>{add_join_count(-1);}));
    join_count_div.appendChild(document.createTextNode(` ${on_add_count}`));
}

const swap_plist = (i, j) => {
    if (i < 0 || i >= plist.length) return;
    if (j < 0 || j >= plist.length) return;
    
    const l = Math.min(i, j);
    const h = Math.max(i, j);
    const p = plist[h];
    plist.splice(h, 1);
    plist.splice(l, 0, p);

    build_ptable();
}

const add_count = (i, count) => {
    plist[i].count += count;

    build_ptable();
}

const range_dec = () => {
    // 最初のptable_active_range個のcountを減らす
    for (let i = 0; i < ptable_active_range && i < plist.length; ++i) --plist[i].count;

    build_ptable();
}

const delete_0 = () => {
    // カウントが0以下のものを削除
    for (let i = plist.length - 1; i >= 0; --i) if (plist[i].count <= 0) delete_plist(i);

    build_ptable();
}

const add_plist = (i, pref) => {
    let p = {
        friend_index : i,
        preferential : pref,
        count : on_add_count
    };

    if (pref) {
        // 優先の最後に追加
        let i = plist.length;
        while (i > 0) {
            if (plist[i-1].preferential || i == ptable_active_range) break;
            --i;
        }
        plist.splice(i, 0, p);
    } else {
        // 単純に最後に追加
        plist.push(p);
    }

    build_ptable();
}

const delete_plist = (i) => {
    if (i < 0 || i >= plist.length) return;
    plist.splice(i, 1);

    build_ptable();
}

const swap_attrib = (i, j) => {
    if (i < 0 || i >= friend_attrib_list.length) return;
    if (j < 0 || j >= friend_attrib_list.length) return;
    
    const l = Math.min(i, j);
    const h = Math.max(i, j);
    const a = friend_attrib_list[h];
    friend_attrib_list.splice(h, 1);
    friend_attrib_list.splice(l, 0, a);

    build_ftable();
    build_ptable();

    auto_save();
}

const swap_flist = (i, j) => {
    if (i < 0 || i >= flist_order.length) return;
    if (j < 0 || j >= flist_order.length) return;
    
    const l = Math.min(i, j);
    const h = Math.max(i, j);
    const o = flist_order[h];
    flist_order.splice(h, 1);
    flist_order.splice(l, 0, o);

    build_ftable();

    auto_save();
}

const change_attrib = (i, value) => {
    // 空文字列なら何もしない
    if (value.length == 0) return;
    // もしすでに存在するattribなら何もしない
    for (let j = 0; j < friend_attrib_list.length; ++j) if (friend_attrib_list[j] == value) return;

    const from = friend_attrib_list[i]; // 元のattrib名

    // flistを一通り更新
    for (let j = 0; j < flist.length; ++j) {
        const fr = flist[j];
        fr[value] = fr[from];
        delete fr[from];
    }

    friend_attrib_list[i] = value;

    auto_save();
}


const parse_friend_csv = (data) => {
    const csv = [];

     // csv配列へ読み込み
    //----------------------
    const lines = data.split('\n'); // 行で分割
    for (let i = 0; i < lines.length; ++i) {
        if (lines[i].length == 0) break; // 空行回避
        const values = lines[i].trim().split(','); // ,で分割
        csv[i] = [];
        for (let j = 0; j < values.length; ++j) {
            csv[i][j] = values[j];
        }
    }

     // 内容を検証
    //-----------------
    // 一行も無かったら無効
    if (csv.length == 0) return;
    // 全部の行の列数が揃ってなかったら無効
    for (let i = 1; i < csv.length; ++i) if (csv[i].length != csv[0].length) return;

     // csvからflistを作成する
    //----------------------------
    for (let y = 0; y < csv.length; ++y) {
        if (y == 0) {
            // csv[0]は属性名の羅列
            for (let x = 0; x < csv[0].length; ++x) friend_attrib_list[x] = csv[0][x];
        } else {
            // csv[1...]は各人のデータ
            flist[y-1] = {};
            for (let x = 0; x < csv[0].length; ++x) if (csv[y][x].length > 0) flist[y-1][friend_attrib_list[x]] = csv[y][x];
        }
    }

    // orderを作り直し
    flist_order.splice(0, flist_order.length);
    for (let i = 0; i < flist.length; ++i) flist_order[i] = i;

    // 参加者リストは消去
    plist.splice(0, plist.length);

    build_ftable();
    build_ptable();
}

const build_friend_csv = () => {
    let content = '';

     // content内にCSVファイルの内容を作成
    //-------------------------------------

    // 1行目
    for (let x = 0; x < friend_attrib_list.length; ++x) {
        content += friend_attrib_list[x];
        if (x == friend_attrib_list.length - 1) {
            content += '\n';
        } else {
            content += ',';
        }
    }
    // flistの内容出力
    for (let i = 0; i < flist.length; ++i) {
        const f = flist[flist_order[i]];
        for (let a = 0; a < friend_attrib_list.length; ++a) {
            const value = f[friend_attrib_list[a]] || '';
            content += value;
            if (a == friend_attrib_list.length - 1) {
                content += '\n';
            } else {
                content += ',';
            }
        }
    }

    return content;
}

const add_new_friend = () => {
    flist.push({});
    flist_order.push(flist_order.length);

    build_ftable();
}

const delete_friend = (i) => {
    // i番目(ftableではなく、flistのインデクス！)の友達を削除する
    flist.splice(i, 1);

    // flist_orderの調整
    // インデクスが等しければ削除、大きければひとつ減らす
    for (let j = flist_order.length - 1; j >= 0; --j) {
        if (flist_order[j] == i) flist_order.splice(j, 1);
        else
        if (flist_order[j] > i) --flist_order[j];
    }

    // plistに削除された人がいたら取り除いておく
    // flistへのインデクスも修正する
    for (let j = plist.length - 1; j >= 0; --j) {
        if (plist[j].friend_index == i) plist.splice(j, 1);
        else
        if (plist[j].friend_index > i) --plist[j].friend_index;
    }

    build_ftable();
    build_ptable();

    auto_save();
}

const add_new_attrib = () => {
    let attrib_name = 'new attrib';

    let count = 1;
    let found;
    do {
        found = false;
        for (let i = 0; i < friend_attrib_list.length; ++i) {
            if (friend_attrib_list[i] == attrib_name) {
                found = true;
                attrib_name = 'new attrib ' + count++;
                break;
            }
        }
    } while (found);

    friend_attrib_list.push(attrib_name);

    build_ftable();
}

const delete_attrib = (name)=>{
    for (let i = 0; i < friend_attrib_list.length; ++i) {
        if (friend_attrib_list[i] == name) {
            friend_attrib_list.splice(i, 1);
            break;
        }
    }

    build_ftable();

    auto_save();
}

const load_flist = async () => {
    const [fhandle] = await window.showOpenFilePicker(csv_file_type);
    const file = await fhandle.getFile();
    const content = await file.text();
    parse_friend_csv(content);

    csv_file_handle = fhandle;
    load_file_button.textContent = fhandle.name;
}

const saveas_flist = async () => {
    const content = build_friend_csv();

    // ファイル取得
    const fhandle = await window.showSaveFilePicker(csv_file_type);
    // 書き込み
    const writable = await fhandle.createWritable();
    await writable.write(content);
    await writable.close();

    csv_file_handle = fhandle;
    load_file_button.textContent = fhandle.name;
}

const save_flist = async () => {
    // ファイル取得
    if (csv_file_handle) {
        const content = build_friend_csv();

        // 書き込み
        const writable = await csv_file_handle.createWritable();
        await writable.write(content);
        await writable.close();
    }
}

const auto_save = () => {
    if (auto_save_enabled) save_flist();
}

const create_sample = () => {
    // とりあえず列を六つ追加
    add_new_attrib();
    add_new_attrib();
    add_new_attrib();
    add_new_attrib();
    add_new_attrib();
    add_new_attrib();
    // 列の名前を登録
    change_attrib(0, 'twitch名');
    change_attrib(1, 'ゲーム1内の名前');
    change_attrib(2, 'ゲーム2内の名前');
    change_attrib(3, 'twitterアカウント');
    change_attrib(4, 'BattleTag');
    change_attrib(5, 'SteamID');
    // 友達を7人ほど追加しておく
    add_new_friend();
    add_new_friend();
    add_new_friend();
    add_new_friend();
    add_new_friend();
    add_new_friend();
    add_new_friend();
    // 各データを適当に登録
    for (let i = 0; i < 7; ++i) {
        for (let j = 0; j < 6; ++j) {
            switch (j) {
                default: value = '';break;
                case 0: value = 'つい'+(i+1)+'っち';break;
                case 1: case 2: value = 'ゲ'+j+'ーマー'+(i+1);break;
                case 3: value = '@account_name_'+(i+1);break;
                case 4: value = 'ゲーマー#'+Math.trunc(Math.random()*9999);break;
                case 5: value = Math.trunc(Math.random()*4200000000);break;
            }
            flist[i][friend_attrib_list[j]] = value;
        }
    }
    // 友達を参加待機リストに追加
    const n = 7 + Math.trunc(Math.random()*5);
    for (let i = 0; i < n; ++i) add_plist(Math.trunc(Math.random()*7), Math.random() < 0.3);
}


window.onload = () => {init();};
